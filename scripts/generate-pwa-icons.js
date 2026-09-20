const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xFF];
  }
  return (c ^ (-1)) >>> 0;
}

function makePNG(width, height) {
  // Raw scanlines: width * 4 bytes + 1 filter byte per line
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const navyR = 0x0d, navyG = 0x1c, navyB = 0x32;
  const goldR = 0xfe, goldG = 0xd0, goldB = 0x1b;

  const center = width / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      // Draw background circle or rounded rect
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Letter "F" bounding box approx
      const inFVertical = (x >= width * 0.32 && x <= width * 0.44 && y >= height * 0.28 && y <= height * 0.72);
      const inFTopHorizontal = (x >= width * 0.32 && x <= width * 0.70 && y >= height * 0.28 && y <= height * 0.40);
      const inFMidHorizontal = (x >= width * 0.32 && x <= width * 0.60 && y >= height * 0.46 && y <= height * 0.56);

      if (inFVertical || inFTopHorizontal || inFMidHorizontal) {
        rawData[offset++] = goldR;
        rawData[offset++] = goldG;
        rawData[offset++] = goldB;
        rawData[offset++] = 255;
      } else {
        rawData[offset++] = navyR;
        rawData[offset++] = navyG;
        rawData[offset++] = navyB;
        rawData[offset++] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0

  const ihdr = Buffer.concat([
    Buffer.from('IHDR'),
    ihdrData
  ]);
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(ihdr), 0);

  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]),
    ihdr,
    ihdrCrc
  ]);

  // IDAT Chunk
  const idatType = Buffer.from('IDAT');
  const idatPayload = Buffer.concat([idatType, deflated]);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(idatPayload), 0);

  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(deflated.length, 0);

  const idatChunk = Buffer.concat([
    idatLen,
    idatPayload,
    idatCrc
  ]);

  // IEND Chunk
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendType), 0);
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    iendType,
    iendCrc
  ]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), makePNG(192, 192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), makePNG(512, 512));
console.log('PWA PNG icons generated successfully in public/');
