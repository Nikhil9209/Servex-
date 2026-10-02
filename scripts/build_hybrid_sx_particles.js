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

let seed = 777;
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

function getRibbonFlowAngle(nx, ny) {
  if (nx > 0.08 && ny > -0.45 && ny < 0.45) {
    return 0.95 + (pseudoRandom() - 0.5) * 0.12;
  }
  if (ny < -0.25) {
    return -0.45 + (nx * 0.7) + (pseudoRandom() - 0.5) * 0.12;
  }
  if (ny > 0.25) {
    return -0.45 - (nx * 0.7) + (pseudoRandom() - 0.5) * 0.12;
  }
  return -0.92 + (pseudoRandom() - 0.5) * 0.12;
}

const minDist = 0.048;
const candidates = [];

for (let y = -0.5; y <= 0.5; y += 0.010) {
  for (let x = -0.5; x <= 0.5; x += 0.009) {
    const b = getBrightness(x, y);
    if (b > 60) {
      const jx = x + (pseudoRandom() - 0.5) * 0.005;
      const jy = y + (pseudoRandom() - 0.5) * 0.005;
      candidates.push({ x: jx, y: jy, b });
    }
  }
}

candidates.sort(() => pseudoRandom() - 0.5);

const particles = [];
for (const cand of candidates) {
  let tooClose = false;
  const dReq = cand.b > 160 ? minDist * 0.88 : minDist * 1.05;
  for (const p of particles) {
    const dx = (cand.x - p.x) * 1.427;
    const dy = (cand.y - p.y);
    if (dx * dx + dy * dy < dReq * dReq) {
      tooClose = true;
      break;
    }
  }
  if (!tooClose) {
    const isDot = pseudoRandom() < 0.40;
    const baseAngle = Number(getRibbonFlowAngle(cand.x, cand.y).toFixed(3));
    const length = isDot ? 0 : Number((4.6 + (cand.b / 255) * 1.8).toFixed(1));
    const diameter = isDot ? Number((2.5 + (cand.b / 255) * 0.8).toFixed(1)) : 0;
    const opacity = Number((0.88 + (cand.b / 255) * 0.12).toFixed(2));
    const phase = Number((pseudoRandom() * Math.PI * 2 - Math.PI).toFixed(2));

    particles.push({
      id: particles.length,
      x: cand.x,
      y: cand.y,
      normX: Number(cand.x.toFixed(4)),
      normY: Number(cand.y.toFixed(4)),
      type: isDot ? 'dot' : 'dash',
      baseAngle,
      length,
      diameter,
      opacity,
      phase,
    });
  }
}

const clean = particles.map(p => ({
  id: p.id,
  normX: p.normX,
  normY: p.normY,
  type: p.type,
  baseAngle: p.baseAngle,
  length: p.length,
  diameter: p.diameter,
  opacity: p.opacity,
  phase: p.phase,
}));

const ts = [
  '// Servex SX Living Particle Field: Precision Hybrid Dots (.) and Dashes (-)',
  'export interface SxHybridParticle {',
  '  id: number;',
  '  normX: number; // -0.5 to 0.5',
  '  normY: number; // -0.5 to 0.5',
  "  type: 'dot' | 'dash';",
  '  baseAngle: number; // Radians (tangential to ribbon curvature)',
  '  length: number; // Dash length in viewBox units',
  '  diameter: number; // Dot diameter in viewBox units',
  '  opacity: number; // 0.88 to 1.0',
  '  phase: number;',
  '}',
  '',
  `export const SX_HYBRID_PARTICLES: SxHybridParticle[] = ${JSON.stringify(clean, null, 2)};`,
  '',
  'export const SX_DOT_PARTICLES = SX_HYBRID_PARTICLES;',
  'export const SX_DASH_PARTICLES = SX_HYBRID_PARTICLES;',
  'export type SxDotParticle = SxHybridParticle;',
  'export type DashParticle = SxHybridParticle;',
  '',
].join('\n');

fs.writeFileSync('src/components/sxDashParticlesData.ts', ts);
console.log('Successfully wrote', clean.length, 'particles to sxDashParticlesData.ts');
