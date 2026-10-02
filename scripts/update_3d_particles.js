const fs = require('fs');

const content = fs.readFileSync('src/components/logoParticles3DData.ts', 'utf8');
const match = content.match(/LOGO_3D_PARTICLES: Logo3DParticle\[\] = (\[[\s\S]*?\]);/);
const particles = JSON.parse(match[1]);

let seed = 42;
function pseudoRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

const updated = particles.map((p) => {
  const isDot = pseudoRandom() < 0.45;
  const angle = p.targetX > 0.1 ? 55 : -52;
  return {
    ...p,
    color: '#FFFFFF',
    shape: isDot ? 'dot' : 'dash',
    angle,
    size: isDot ? Number((p.size * 0.95).toFixed(1)) : Number((p.size * 1.1).toFixed(1)),
  };
});

const ts = [
  '// 3D Hybrid Particles Definition for Servex Monogram (Dots & Dashes)',
  'export interface Logo3DParticle {',
  '  id: number;',
  '  targetX: number; // Normalized target X (-0.5 to 0.5)',
  '  targetY: number; // Normalized target Y (-0.5 to 0.5)',
  '  targetZ: number; // Normalized 3D depth Z (-0.5 to 0.5)',
  '  scatterX: number; // Initial 3D space scatter X',
  '  scatterY: number; // Initial 3D space scatter Y',
  '  scatterZ: number; // Initial 3D space scatter Z',
  '  size: number;',
  '  color: string;',
  '  delay: number; // ms',
  "  layer: 'front' | 'depth' | 'bevel';",
  "  shape: 'dot' | 'dash';",
  '  angle: number; // degrees for dash tilt',
  '}',
  '',
  'export const LOGO_3D_PARTICLES: Logo3DParticle[] = ' + JSON.stringify(updated, null, 2) + ';',
  '',
].join('\n');

fs.writeFileSync('src/components/logoParticles3DData.ts', ts);
console.log('Successfully updated logoParticles3DData.ts with pure white dots and dashes');
