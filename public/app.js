const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const statusEl = document.getElementById('status');
const wrapper = document.getElementById('imageWrapper');
const img = document.getElementById('ocrImage');
const copyAllBtn = document.getElementById('copyAllBtn');
const copyFallback = document.getElementById('copyFallback');

let currentLines = [];
let fullText = '';

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function clearOverlay() {
  wrapper.querySelectorAll('.ocr-line').forEach((el) => el.remove());
}

function positionSpan(span, bbox, scale) {
  const left = bbox.x0 * scale;
  const top = bbox.y0 * scale;
  const targetWidth = (bbox.x1 - bbox.x0) * scale;
  const targetHeight = (bbox.y1 - bbox.y0) * scale;

  span.style.left = `${left}px`;
  span.style.top = `${top}px`;
  span.style.height = `${targetHeight}px`;
  span.style.fontSize = `${targetHeight}px`;
  span.style.transform = 'none';

  const naturalWidth = span.getBoundingClientRect().width || 1;
  span.style.transform = `scaleX(${targetWidth / naturalWidth})`;
}

function renderOverlay() {
  clearOverlay();
  if (!img.naturalWidth) return;
  const scale = img.clientWidth / img.naturalWidth;
  for (const line of currentLines) {
    const span = document.createElement('span');
    span.className = 'ocr-line';
    span.textContent = line.text;
    wrapper.appendChild(span);
    positionSpan(span, line.bbox, scale);
  }
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderOverlay, 100);
});

async function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    setStatus('Please choose an image file.', true);
    return;
  }

  clearOverlay();
  copyAllBtn.hidden = true;
  wrapper.hidden = false;
  img.src = URL.createObjectURL(file);
  setStatus('Uploading…');

  const formData = new FormData();
  formData.append('image', file);

  try {
    setStatus('Running OCR… this can take a few seconds');
    const res = await fetch('/ocr', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || 'OCR failed.', true);
      return;
    }

    currentLines = data.lines || [];
    fullText = data.text || '';

    const showOverlay = () => renderOverlay();
    if (img.complete && img.naturalWidth) {
      showOverlay();
    } else {
      img.addEventListener('load', showOverlay, { once: true });
    }

    copyAllBtn.hidden = fullText.trim().length === 0;
    setStatus(`Done — found ${currentLines.length} line(s) of text.`);
  } catch (err) {
    setStatus('Network error: ' + err.message, true);
  }
}

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});

copyAllBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(fullText);
    setStatus('Copied all text to clipboard.');
  } catch {
    copyFallback.value = fullText;
    copyFallback.hidden = false;
    copyFallback.select();
    document.execCommand('copy');
    copyFallback.hidden = true;
    setStatus('Copied all text to clipboard.');
  }
});
