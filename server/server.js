import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOcrWorker, recognizeWithWorker } from '../lib/ocr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('UNSUPPORTED_TYPE'));
    cb(null, true);
  },
});

app.use(express.static(path.join(__dirname, '..', 'public')));

let worker;

app.post('/ocr', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded (field "image").' });
  try {
    res.json(await recognizeWithWorker(worker, req.file.buffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OCR failed: ' + err.message });
  }
});

app.use((err, req, res, next) => {
  if (err.message === 'UNSUPPORTED_TYPE') {
    return res.status(400).json({ error: 'Unsupported file type. Please upload an image.' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image too large (max 20MB).' });
  }
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const PORT = process.env.PORT || 3000;
worker = await createOcrWorker('eng');
const server = app.listen(PORT, () => console.log(`OCR web UI: http://localhost:${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    await worker.terminate();
    server.close(() => process.exit(0));
  });
}
