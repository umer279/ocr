import path from 'node:path';
import { createWorker } from 'tesseract.js';

const CACHE_PATH = path.join(process.cwd(), '.cache');

export async function createOcrWorker(lang = 'eng') {
  return createWorker(lang, 1, { cachePath: CACHE_PATH });
}

function flattenLines(blocks = []) {
  const lines = [];
  for (const block of blocks) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        const text = line.text.replace(/\s+$/, '');
        if (text.length === 0) continue;
        lines.push({ text, bbox: line.bbox, confidence: line.confidence });
      }
    }
  }
  return lines;
}

export function normalizeResult(data) {
  return { text: data.text, lines: flattenLines(data.blocks) };
}

export async function recognizeWithWorker(worker, image) {
  const { data } = await worker.recognize(image, {}, { blocks: true });
  return normalizeResult(data);
}

export async function recognizeOnce(image, lang = 'eng') {
  const worker = await createOcrWorker(lang);
  try {
    return await recognizeWithWorker(worker, image);
  } finally {
    await worker.terminate();
  }
}
