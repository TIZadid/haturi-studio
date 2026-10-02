import type * as T from 'three';
import { mulberry32 } from '../../lib/random';

export function makeWood(THREE: typeof T, o: { base: string; dark: string; light: string; seed: number }): T.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const rand = mulberry32(o.seed);
  g.fillStyle = o.base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 140; i++) {
    const y0 = rand() * size;
    const amp = 2 + rand() * 6;
    const freq = 0.004 + rand() * 0.01;
    g.strokeStyle = rand() > 0.5 ? o.dark : o.light;
    g.globalAlpha = 0.08 + rand() * 0.18;
    g.lineWidth = 0.6 + rand() * 2.2;
    g.beginPath();
    for (let x = 0; x <= size; x += 8) g.lineTo(x, y0 + Math.sin(x * freq + i) * amp);
    g.stroke();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
