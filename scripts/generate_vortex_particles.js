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

function getLogoBrightness(normX, normY) {
  const minX = 196, maxX = 821, minY = 263, maxY = 701;
  const px = Math.round(minX + (normX + 0.5) * (maxX - minX));
  const py = Math.round(minY + (normY + 0.5) * (maxY - minY));
  if (px < 0 || px >= width || py < 0 || py >= height) return 0;
  
  let sum = 0, count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const sx = px + dx;
      const sy = py + dy;
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        const idx = (sy * width + sx) * 4;
        sum += (img[idx] + img[idx + 1] + img[idx + 2]) / 3;
        count++;
      }
    }
  }
  return sum / count;
}

let seed = 1337;
function pseudoRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

const cols = 23;
const rows = 19;
const particles = [];

for (let r = 0; r < rows; r++) {
  const ny = (r / (rows - 1) - 0.5); // -0.5 to 0.5
  for (let c = 0; c < cols; c++) {
    const nx = (c / (cols - 1) - 0.5); // -0.5 to 0.5
    // Oval / rounded bounding boundary for the particle field
    const distSq = (nx / 0.52) * (nx / 0.52) + (ny / 0.52) * (ny / 0.52);
    if (distSq > 1.05) continue;

    // Check SX logo brightness
    const brightness = getLogoBrightness(nx * 1.08, ny * 1.08);
    const isLogo = brightness > 75;

    // Vortex swirl tangential angle (clockwise vector: (-y, x))
    const polarAngle = Math.atan2(ny, nx);
    const vortexTangent = polarAngle - Math.PI / 2;

    // Add subtle organic slant / variation (Image 1 has tangential flow with forward slant)
    const baseAngle = Number((vortexTangent + (pseudoRandom() - 0.5) * 0.15).toFixed(3));

    // Length and stroke width:
    // Logo particles are bold and prominent; ambient field particles are delicate
    const baseLength = isLogo 
      ? Number((8.2 + pseudoRandom() * 1.8).toFixed(1)) // 8.2 - 10.0
      : Number((5.2 + pseudoRandom() * 1.4).toFixed(1)); // 5.2 - 6.6

    const strokeWidth = isLogo ? 1.75 : 1.25;

    // Opacity: Logo is crisp white 0.92-1.0; field is 0.22-0.38
    const opacity = isLogo
      ? Number((0.90 + (brightness / 255) * 0.10).toFixed(2))
      : Number((0.20 + pseudoRandom() * 0.16).toFixed(2));

    // Accent: 16% of logo particles are ocean blue
    const isAccent = isLogo && pseudoRandom() < 0.16;

    // Wave phase offset for harmonic rippling
    const phase = Number((pseudoRandom() * Math.PI * 2 - Math.PI).toFixed(2));

    particles.push({
      id: particles.length,
      col: c,
      row: r,
      normX: Number(nx.toFixed(4)),
      normY: Number(ny.toFixed(4)),
      baseAngle,
      baseLength,
      strokeWidth,
      opacity,
      isLogo,
      isAccent,
      phase,
    });
  }
}

console.log('Generated particles:', particles.length);
console.log('Logo particles:', particles.filter(p => p.isLogo).length);
console.log('Accent particles:', particles.filter(p => p.isAccent).length);
console.log('Field particles:', particles.filter(p => !p.isLogo).length);

const tsContent = [
  '// Pre-calculated Dash Particle Grid mapped precisely to Servex SX logo with surrounding vortex flow field',
  'export interface DashParticle {',
  '  id: number;',
  '  col: number;',
  '  row: number;',
  '  normX: number; // Normalized X offset (-0.5 to 0.5)',
  '  normY: number; // Normalized Y offset (-0.5 to 0.5)',
  '  baseAngle: number; // Radians',
  '  baseLength: number; // Dash length in SVG units',
  '  strokeWidth: number; // Stroke width',
  '  opacity: number; // Base opacity',
  '  isLogo: boolean; // True if part of the Servex SX logo shape',
  '  isAccent: boolean; // True for subtle ocean blue accent',
  '  phase: number; // Wave phase offset',
  '}',
  '',
  `export const SX_DASH_PARTICLES: DashParticle[] = ${JSON.stringify(particles, null, 2)};`,
  '',
].join('\n');

fs.writeFileSync('src/components/sxDashParticlesData.ts', tsContent);
console.log('Successfully wrote src/components/sxDashParticlesData.ts');
