const form = document.getElementById('spriteForm');
const fileInput = document.getElementById('spriteImage');
const animationSelect = document.getElementById('animation');
const directionSelect = document.getElementById('direction');
const frameSizeInput = document.getElementById('frameSize');
const loadingMessage = document.getElementById('loadingMessage');
const resultContainer = document.getElementById('resultContainer');
const spritePreview = document.getElementById('spritePreview');
const spriteMeta = document.getElementById('spriteMeta');
const statusText = document.getElementById('statusText');

const animationLabels = {
  walk: 'Caminar',
  idle: 'Idle',
  run: 'Correr',
  jump: 'Saltar',
  attack: 'Atacar',
  hurt: 'Herido'
};

const directionLabels = {
  right: 'Derecha',
  left: 'Izquierda',
  front: 'Frontal',
  back: 'Trasera'
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!fileInput.files || !fileInput.files[0]) {
    statusText.textContent = 'Primero sube una imagen del personaje.';
    statusText.style.color = '#ff9d9d';
    return;
  }

  const formData = new FormData();
  formData.append('spriteImage', fileInput.files[0]);
  formData.append('animation', animationSelect.value);
  formData.append('direction', directionSelect.value);
  formData.append('frameSize', frameSizeInput.value);

  loadingMessage.hidden = false;
  resultContainer.hidden = true;
  statusText.textContent = 'Generando hoja de sprite...';
  statusText.style.color = '#a9f3ff';

  try {
    const response = await fetch('/api/generate-sprite', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'No se pudo generar la hoja de sprite.');
    }

    const imageUrl = payload.spriteSheetUrl;
    spritePreview.src = imageUrl;
    spritePreview.alt = `${animationSelect.value} ${directionSelect.value} sprite sheet`;

    spriteMeta.innerHTML = `
      <strong>Animación:</strong> ${animationLabels[payload.animation] || payload.animation}<br>
      <strong>Dirección:</strong> ${directionLabels[payload.direction] || payload.direction}<br>
      <strong>Frame Size:</strong> ${payload.frameSize}px<br>
      <strong>Archivo PNG:</strong> <a href="${imageUrl}" target="_blank" rel="noopener noreferrer">Descargar</a><br>
      <strong>JSON:</strong> <a href="${payload.metadataUrl}" target="_blank" rel="noopener noreferrer">Ver metadata</a>
    `;

    resultContainer.hidden = false;
    loadingMessage.hidden = true;
    statusText.textContent = '¡Sprite generado correctamente!';
    statusText.style.color = '#b5ff9b';
  } catch (error) {
    console.error(error);
    loadingMessage.hidden = true;
    statusText.textContent = error.message || 'Ha ocurrido un error.';
    statusText.style.color = '#ff9d9d';
  }
});
