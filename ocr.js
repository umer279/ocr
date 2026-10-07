#!/usr/bin/env node
import { access, constants } from 'node:fs/promises';
import { recognizeOnce } from './lib/ocr.js';

function usage(code) {
  console.error('Usage: node ocr.js <path-to-image> [--lang <langcode>]');
  process.exit(code);
}

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
  usage(argv.length === 0 ? 1 : 0);
}

let lang = 'eng';
const li = argv.findIndex((a) => a === '--lang' || a === '-l');
if (li !== -1) {
  lang = argv[li + 1];
  argv.splice(li, 2);
}

const imagePath = argv[0];
if (!imagePath) usage(1);

try {
  await access(imagePath, constants.R_OK);
} catch {
  console.error(`Error: cannot read file "${imagePath}".`);
  process.exit(1);
}

try {
  const { text } = await recognizeOnce(imagePath, lang);
  process.stdout.write(text.endsWith('\n') ? text : text + '\n');
} catch (err) {
  console.error(`OCR failed: ${err.message}`);
  process.exit(1);
}
