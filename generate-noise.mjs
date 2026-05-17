// generate-noise.mjs — Run with: node generate-noise.mjs
// Creates a subtle grain noise texture as noise.png

import { writeFileSync } from 'fs';

const size = 200;
const channels = 4; // RGBA

// Create raw pixel data
const pixels = new Uint8Array(size * size * channels);

for (let i = 0; i < size * size; i++) {
  const offset = i * channels;
  const noise = Math.random() * 30; // subtle value 0-30
  pixels[offset] = noise;     // R
  pixels[offset + 1] = noise; // G
  pixels[offset + 2] = noise; // B
  pixels[offset + 3] = Math.random() * 15 + 5; // A: very low opacity (5-20)
}

// Create minimal PNG manually
function createPNG(width, height, rgbaData) {
  // CRC table
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf, offset, length) {
    let c = -1;
    for (let i = offset; i < offset + length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return c ^ -1;
  }

  function adler32(data) {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 16) | a;
  }

  // Raw image data with filter bytes
  const rawData = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // None filter
    for (let x = 0; x < width * 4; x++) {
      rawData[y * (1 + width * 4) + 1 + x] = rgbaData[y * width * 4 + x];
    }
  }

  // Deflate (store only - no compression for simplicity)
  const blocks = [];
  const maxBlock = 65535;
  for (let i = 0; i < rawData.length; i += maxBlock) {
    const len = Math.min(maxBlock, rawData.length - i);
    const isLast = i + maxBlock >= rawData.length;
    const block = new Uint8Array(5 + len);
    block[0] = isLast ? 1 : 0;
    block[1] = len & 0xff;
    block[2] = (len >> 8) & 0xff;
    block[3] = (~len) & 0xff;
    block[4] = ((~len) >> 8) & 0xff;
    block.set(rawData.subarray(i, i + len), 5);
    blocks.push(block);
  }

  const totalDeflate = blocks.reduce((s, b) => s + b.length, 0);
  const zlibData = new Uint8Array(2 + totalDeflate + 4);
  zlibData[0] = 0x78; // CMF
  zlibData[1] = 0x01; // FLG
  let offset = 2;
  for (const block of blocks) {
    zlibData.set(block, offset);
    offset += block.length;
  }
  const adler = adler32(rawData);
  zlibData[offset] = (adler >> 24) & 0xff;
  zlibData[offset + 1] = (adler >> 16) & 0xff;
  zlibData[offset + 2] = (adler >> 8) & 0xff;
  zlibData[offset + 3] = adler & 0xff;

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const chunk = Buffer.alloc(4 + type.length + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4);
    data.copy ? data.copy(chunk, 4 + type.length) : Buffer.from(data).copy(chunk, 4 + type.length);
    const crc = crc32(chunk, 4, type.length + data.length);
    chunk.writeInt32BE(crc, 4 + type.length + data.length);
    return chunk;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', Buffer.from(zlibData));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const png = createPNG(size, size, pixels);
writeFileSync('public/noise.png', png);
console.log(`✓ noise.png created (${png.length} bytes) — ${size}x${size} grain texture`);
