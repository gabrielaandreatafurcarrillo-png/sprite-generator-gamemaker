require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { generateSpriteSheet } = require('./src/services/spriteService');

const app = express();
const port = Number(process.env.PORT || 3000);
const generatedDir = path.join(__dirname, 'generated');

fs.mkdirSync(generatedDir, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/generated', express.static(generatedDir));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.diskStorage({
    destination: generatedDir,
    filename: (_, file, cb) => {
      const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e6);
      cb(null, `upload-${uniquePrefix}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Formato de imagen no soportado. Usa PNG, JPG o WEBP.'));
  }
});

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    message: 'Sprite generator ready',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/generate-sprite', upload.single('spriteImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: 'Debes subir una imagen del personaje.'
      });
    }

    const animation = req.body.animation || 'walk';
    const direction = req.body.direction || 'right';
    const frameSize = Number(req.body.frameSize || process.env.FRAME_SIZE || 64);

    const result = await generateSpriteSheet(req.file.path, {
      animation,
      direction,
      frameSize,
      columns: 4,
      rows: 3,
      totalFrames: 12
    });

    return res.json({
      ok: true,
      animation,
      direction,
      frameSize,
      spriteSheetUrl: `/generated/${result.sheetFileName}`,
      metadataUrl: `/generated/${result.metadataFileName}`,
      message: 'Hoja de sprite generada correctamente.'
    });
  } catch (error) {
    console.error('Error generating sprite sheet:', error);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error al generar la hoja de sprite.'
    });
  }
});

app.use((error, _, res, __) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, message: error.message });
  }

  return res.status(400).json({ ok: false, message: error.message || 'Ha ocurrido un error.' });
});

app.listen(port, () => {
  console.log(`Sprite generator running at http://localhost:${port}`);
});
