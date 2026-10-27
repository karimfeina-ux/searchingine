import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer
  const rowStride = width * 4;
  const rawData = Buffer.alloc((rowStride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowStride + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[i] = c >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const checksum = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(checksum, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function iconPainter(isMaskable) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Deep navy/slate background #0b1120 -> #1e1b4b
    const t = (x + y) / (w + h);
    let r = Math.round(11 + t * 19);
    let g = Math.round(17 + t * 10);
    let b = Math.round(32 + t * 43);
    let a = 255;

    // Outer rings
    const outerRadius = w * 0.42;
    if (Math.abs(dist - outerRadius) < w * 0.008) {
      r = 56; g = 189; b = 248; // cyan
    } else if (Math.abs(dist - outerRadius * 0.7) < w * 0.006) {
      r = 99; g = 102; b = 241; // indigo
    } else if (Math.abs(dist - outerRadius * 0.35) < w * 0.005) {
      r = 139; g = 92; b = 246; // violet
    }

    // Crosshair line
    if ((Math.abs(dx) < w * 0.008 || Math.abs(dy) < h * 0.008) && dist < outerRadius * 1.05) {
      r = Math.min(255, r + 60);
      g = Math.min(255, g + 80);
      b = Math.min(255, b + 120);
    }

    // Center badge
    if (dist < outerRadius * 0.45) {
      r = 15; g = 23; b = 42;
      // target center dot
      if (dist < outerRadius * 0.15) {
        r = 56; g = 189; b = 248; // cyan center
      }
    }

    // Corner rounding for non-maskable
    if (!isMaskable) {
      const radius = w * 0.22;
      const rx = Math.abs(x - cx);
      const ry = Math.abs(y - cy);
      const qx = Math.max(0, rx - (cx - radius));
      const qy = Math.max(0, ry - (cy - radius));
      if (qx * qx + qy * qy > radius * radius) {
        a = 0;
      }
    }

    return [r, g, b, a];
  };
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, iconPainter(false)));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, iconPainter(false)));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, iconPainter(true)));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, iconPainter(false)));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPng(64, 64, iconPainter(false)));

console.log('Successfully generated all PWA icons.');
