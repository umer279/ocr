# nuov — Image OCR

Extract text from images, from the terminal or a small web UI, using [tesseract.js](https://github.com/naptha/tesseract.js) (runs locally, no API keys).

## Setup

```
npm install
```

The first OCR run (CLI or web) downloads the English language data (~11-15MB) from a CDN and caches it in `.cache/`. Every run after that works offline.

## CLI

```
node ocr.js <path-to-image> [--lang <langcode>]
```

Prints all recognized text to stdout. Example: `node ocr.js ./screenshot.png > out.txt`.

## Web UI

```
npm start
```

Open http://localhost:3000, then drag & drop (or click to choose) an image. Once OCR finishes, drag over the text directly on the image to select and copy it, or use the "Copy all text" button.
