const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('assets/servex_logo.png');
let pos = 8;
let width = 0, height = 0;
const idatChunks = [];

while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.slice(pos + 4, pos + 8).toString('ascii');
  if (type === 'IHDR') {
    width = buf.readUInt32BE(pos + 8);
    height = buf.readUInt32BE(pos + 12);
  } else if (type === 'IDAT') {
    idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
  } else if (type === 'IEND') {
    break;
  }
  pos += 12 + len;
}

const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
const bpp = 4;
const lineLen = 1 + width * bpp;
const img = Buffer.alloc(width * height * bpp);

for (let y = 0; y < height; y++) {
  for (let i = 0; i < width * bpp; i++) {
    const rawVal = decompressed[y * lineLen + 1 + i];
    const upVal = y > 0 ? img[(y - 1) * width * bpp + i] : 0;
    img[y * width * bpp + i] = (rawVal + upVal) & 0xff;
  }
}

const minX = 196, maxX = 821, minY = 263, maxY = 701;
const logoW = maxX - minX;
const logoH = maxY - minY;

let seed = 42;
function pseudoRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function getBrightness(nx, ny) {
  const px = Math.round(minX + (nx + 0.5) * logoW);
  const py = Math.round(minY + (ny + 0.5) * logoH);
  if (px < 0 || px >= width || py < 0 || py >= height) return 0;
  const idx = (py * width + px) * 4;
  return (img[idx] + img[idx + 1] + img[idx + 2]) / 3;
}

const minDist = 0.052;
const candidates = [];

for (let y = -0.5; y <= 0.5; y += 0.012) {
  for (let x = -0.5; x <= 0.5; x += 0.010) {
    const b = getBrightness(x, y);
    if (b > 65) {
      const jx = x + (pseudoRandom() - 0.5) * 0.005;
      const jy = y + (pseudoRandom() - 0.5) * 0.005;
      candidates.push({ x: jx, y: jy, b });
    }
  }
}

candidates.sort(() => pseudoRandom() - 0.5);

const dots = [];
for (const cand of candidates) {
  let tooClose = false;
  const dReq = cand.b > 160 ? minDist * 0.90 : minDist * 1.05;
  for (const d of dots) {
    const dx = (cand.x - d.x) * 1.427;
    const dy = (cand.y - d.y);
    if (dx * dx + dy * dy < dReq * dReq) {
      tooClose = true;
      break;
    }
  }
  if (!tooClose) {
    const diameter = Number((2.4 + (cand.b / 255) * 0.8).toFixed(1));
    dots.push({
      id: dots.length,
      x: cand.x,
      y: cand.y,
      normX: Number(cand.x.toFixed(4)),
      normY: Number(cand.y.toFixed(4)),
      diameter,
      phase: Number((pseudoRandom() * Math.PI * 2 - Math.PI).toFixed(2)),
    });
  }
}

console.log('Final organic SX dots count:', dots.length);

const cleanDots = dots.map(d => ({
  id: d.id,
  normX: d.normX,
  normY: d.normY,
  diameter: d.diameter,
  phase: d.phase,
}));

const tsContent = [
  '// Precise organic white dot particles stippled along Servex SX logo ribbon contours',
  'export interface SxDotParticle {',
  '  id: number;',
  '  normX: number; // -0.5 to 0.5',
  '  normY: number; // -0.5 to 0.5',
  '  diameter: number; // 2.4 to 3.2 dp',
  '  phase: number;',
  '}',
  '',
  `export const SX_DOT_PARTICLES: SxDotParticle[] = ${JSON.stringify(cleanDots, null, 2)};`,
  '',
  'export const SX_DASH_PARTICLES = SX_DOT_PARTICLES;',
  'export type DashParticle = SxDotParticle;',
  '',
].join('\n');

fs.writeFileSync('src/components/sxDashParticlesData.ts', tsContent);
console.log('Successfully wrote src/components/sxDashParticlesData.ts');
