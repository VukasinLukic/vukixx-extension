// Run: node scripts/generate-icons.js
// Generates PNG icon files for the Chrome extension

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets');

function createPNG(size) {
  const width = size;
  const height = size;
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const t = (x + y) / (width + height);
      const r = Math.round(99 + (139 - 99) * t);
      const g = Math.round(102 + (92 - 102) * t);
      const b = Math.round(241 + (246 - 241) * t);

      const cx = width / 2;
      const cy = height / 2;
      const cornerR = size * 0.22;

      // Rounded rect mask
      let inside = true;
      if (x < cornerR && y < cornerR) {
        inside = Math.hypot(x - cornerR, y - cornerR) <= cornerR;
      } else if (x >= width - cornerR && y < cornerR) {
        inside = Math.hypot(x - (width - cornerR), y - cornerR) <= cornerR;
      } else if (x < cornerR && y >= height - cornerR) {
        inside = Math.hypot(x - cornerR, y - (height - cornerR)) <= cornerR;
      } else if (x >= width - cornerR && y >= height - cornerR) {
        inside = Math.hypot(x - (width - cornerR), y - (height - cornerR)) <= cornerR;
      }

      if (!inside) {
        pixels[i] = pixels[i + 1] = pixels[i + 2] = pixels[i + 3] = 0;
        continue;
      }

      // White cross in center
      const crossW = Math.max(1, Math.floor(size * 0.08));
      const crossLen = Math.floor(size * 0.25);
      const isCross =
        (Math.abs(x - cx) < crossW && Math.abs(y - cy) < crossLen) ||
        (Math.abs(y - cy) < crossW && Math.abs(x - cx) < crossLen);

      if (isCross) {
        pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255; pixels[i + 3] = 255;
      } else {
        pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
      }
    }
  }

  return encodePNG(width, height, pixels);
}

function encodePNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcData) >>> 0);
  return Buffer.concat([length, typeBuffer, data, crcBuf]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}

// Generate
fs.mkdirSync(ASSETS_DIR, { recursive: true });
for (const size of [16, 48, 128]) {
  const png = createPNG(size);
  const filepath = path.join(ASSETS_DIR, `icon-${size}.png`);
  fs.writeFileSync(filepath, png);
  console.log(`Generated ${filepath} (${png.length} bytes)`);
}
