const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const VALID_ANIMATIONS = ['idle', 'walk', 'run', 'jump', 'attack', 'hurt'];
const VALID_DIRECTIONS = ['right', 'left', 'front', 'back'];

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pickAnimationSettings(animation, direction) {
  const animationName = VALID_ANIMATIONS.includes(animation) ? animation : 'walk';
  const directionName = VALID_DIRECTIONS.includes(direction) ? direction : 'right';

  return {
    animation: animationName,
    direction: directionName
  };
}

async function buildFrameFromReference(inputPath, options) {
  const {
    frameSize,
    index,
    totalFrames,
    animation,
    direction
  } = options;

  const base = sharp(inputPath);
  const birthMeta = await base.metadata();

  const width = birthMeta.width || frameSize;
  const height = birthMeta.height || frameSize;
  const aspect = width / height;
  const targetWidth = Math.round(frameSize * (0.85 + (Math.sin((index / totalFrames) * Math.PI * 2) + 1) * 0.08));
  const targetHeight = Math.round(frameSize * (0.85 + (Math.cos((index / totalFrames) * Math.PI * 2) + 1) * 0.08));

  let image = sharp(inputPath)
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });

  if (direction === 'left') {
    image = image.flop();
  }

  if (direction === 'front' || direction === 'back') {
    image = image.rotate(direction === 'back' ? 0 : 0, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }

  const resizedBuffer = await image.png().toBuffer();

  const resizedMeta = await sharp(resizedBuffer).metadata();
  const resizedW = resizedMeta.width || frameSize;
  const resizedH = resizedMeta.height || frameSize;

  const walkPhase = Math.sin((index / totalFrames) * Math.PI * 2);
  const motionX = direction === 'left' ? -Math.round(walkPhase * 4) : Math.round(walkPhase * 4);
  const motionY = animation === 'jump' ? (index < totalFrames / 2 ? -6 : 6) : animation === 'hurt' ? 4 : Math.round(Math.sin(index * 0.8) * 2.5);

  const canvas = sharp({
    create: {
      width: frameSize,
      height: frameSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const left = Math.round((frameSize - resizedW) / 2) + motionX;
  const top = Math.round((frameSize - resizedH) / 2) + motionY;

  const frame = await canvas
    .composite([
      {
        input: resizedBuffer,
        left,
        top
      }
    ])
    .png()
    .toBuffer();

  return frame;
}

async function composeSpriteSheet(frames, { frameSize, columns, rows }) {
  const sheetWidth = frameSize * columns;
  const sheetHeight = frameSize * rows;

  const composites = frames.map((frame, index) => ({
    input: frame,
    left: (index % columns) * frameSize,
    top: Math.floor(index / columns) * frameSize
  }));

  const sheet = await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toBuffer();

  return sheet;
}

async function generateSpriteSheet(inputPath, options = {}) {
  const { animation, direction } = pickAnimationSettings(options.animation, options.direction);
  const frameSize = Number(options.frameSize || 64);
  const columns = Number(options.columns || 4);
  const rows = Number(options.rows || 3);
  const totalFrames = Number(options.totalFrames || 12);

  const generatedDir = path.join(__dirname, '..', 'generated');
  await ensureDir(generatedDir);

  const frames = [];
  for (let index = 0; index < totalFrames; index += 1) {
    const frame = await buildFrameFromReference(inputPath, {
      frameSize,
      index,
      totalFrames,
      animation,
      direction
    });
    frames.push(frame);
  }

  const sheetBuffer = await composeSpriteSheet(frames, { frameSize, columns, rows });

  const timestamp = Date.now();
  const sheetFileName = `sprite-sheet-${timestamp}.png`;
  const metadataFileName = `sprite-sheet-${timestamp}.json`;

  const sheetPath = path.join(generatedDir, sheetFileName);
  const metadataPath = path.join(generatedDir, metadataFileName);

  await sharp(sheetBuffer).png().toFile(sheetPath);

  const metadata = {
    name: 'pixel-art-sprite-sheet',
    animation,
    direction,
    frameSize,
    columns,
    rows,
    totalFrames,
    width: frameSize * columns,
    height: frameSize * rows,
    transparentBackground: true,
    format: 'PNG',
    importIntoGameMaker: {
      columns: 4,
      rows: 3,
      frameWidth: frameSize,
      frameHeight: frameSize,
      note: 'Importa la hoja en GameMaker con 4 columnas y 3 filas. Ajusta la velocidad de animación según el proyecto.'
    }
  };

  await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  return {
    sheetFileName,
    metadataFileName,
    sheetPath,
    metadataPath,
    metadata
  };
}

module.exports = {
  generateSpriteSheet,
  VALID_ANIMATIONS,
  VALID_DIRECTIONS
};
