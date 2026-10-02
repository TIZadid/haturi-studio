import type * as T from 'three';
import { easeOutBounce, gridSlots, nextFree } from '../layout';
import { tokenColor } from '../tokens';
import { makeWood } from '../wood';
import type { ModelFactory } from './types';

const W = 23, H = 23, D = 4.5, F = 0.75, ROWS = 4, COLS = 4, SHELF = 0.6, DROP = 0.6;

export const createGridShelf: ModelFactory = (ctx) => {
  const { THREE } = ctx;
  const root = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];
  const track = <X extends { dispose(): void }>(x: X) => (disposables.push(x), x);

  const tex = track(makeWood(THREE, {
    base: tokenColor('--color-accent-2-900'), dark: tokenColor('--color-neutral-900'), light: tokenColor('--color-accent-2-800'), seed: 23,
  }));
  const wood = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.68 }));
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), wood);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  };

  box(W, H, 0.4, 0, 0, -D / 2 + 0.2);                 // back
  box(F, H, D, -W / 2 + F / 2, 0, 0);                  // left side
  box(F, H, D, W / 2 - F / 2, 0, 0);                   // right side
  box(W, F, D, 0, H / 2 - F / 2, 0);                   // top
  box(W, F, D, 0, -H / 2 + F / 2, 0);                  // bottom
  const rowH = (H - 2 * F) / ROWS, colW = (W - 2 * F) / COLS;
  const shelfYs = Array.from({ length: ROWS - 1 }, (_, i) => H / 2 - F - rowH * (i + 1));
  shelfYs.forEach((y) => box(W - 2 * F, SHELF, D, 0, y, 0));
  // the signature cross-lap pegs at each column line, front edge
  const pegXs = Array.from({ length: COLS - 1 }, (_, i) => -W / 2 + F + colW * (i + 1));
  const pegYs = [H / 2 - F, ...shelfYs, -H / 2 + F];
  for (const y of pegYs) for (const x of pegXs) box(0.6, 2.2, 0.6, x, y, D / 2 - 0.3);

  // cups: lathe body + torus handle, glazes from tokens
  const profile = [[0, 0], [1.25, 0], [1.4, 0.2], [1.45, 2.6], [1.38, 2.7]].map(([x, y]) => new THREE.Vector2(x, y));
  const bodyGeo = track(new THREE.LatheGeometry(profile, 36));
  const handleGeo = track(new THREE.TorusGeometry(0.62, 0.13, 10, 24, Math.PI * 1.1));
  const glazes = ['--color-cream', '--color-accent-2-100', '--color-neutral-200', '--color-accent-2-200', '--color-neutral-700'].map((n) =>
    track(new THREE.MeshStandardMaterial({ color: tokenColor(n), roughness: 0.35, side: THREE.DoubleSide })));

  const slots = gridSlots({ width: W, height: H, rows: ROWS, cols: COLS, frame: F });
  type Cup = { group: T.Group; slot: number; born: number; floor: number };
  const cups: Cup[] = [];
  let clock = 0;

  function place(slot: number, settled = false) {
    const s = slots[slot];
    const floor = s.y - rowH / 2 + SHELF / 2;
    const group = new THREE.Group();
    const mat = glazes[slot % glazes.length];
    const body = new THREE.Mesh(bodyGeo, mat);
    const handle = new THREE.Mesh(handleGeo, mat);
    handle.position.set(1.45, 1.35, 0);
    handle.rotation.z = -Math.PI * 0.55;
    body.castShadow = handle.castShadow = true;
    group.add(body, handle);
    group.position.set(s.x, floor, 0.2);
    group.rotation.y = ((slot * 37) % 120) * (Math.PI / 180) - Math.PI / 3;
    root.add(group);
    cups.push({ group, slot, born: settled ? -100 : clock, floor });
  }

  // a few cups already in place, so it reads as a shelf in use
  for (const slot of [1, 6, 8, 15]) place(slot, true);

  return {
    root,
    size: { width: W, height: H },
    pick(point) {
      const local = root.worldToLocal(point.clone());
      let preferred = 0, best = Infinity;
      slots.forEach((s, i) => { const d = Math.hypot(s.x - local.x, s.y - local.y); if (d < best) { best = d; preferred = i; } });
      const slot = nextFree(new Set(cups.map((c) => c.slot)), slots.length, preferred);
      if (slot === null) { root.userData.shake = clock; return; }
      place(slot);
      ctx.changed();
    },
    update(_dt, elapsed) {
      clock = elapsed;
      for (const c of cups) {
        const k = ctx.reduced ? 1 : Math.min((clock - c.born) / DROP, 1);
        c.group.position.y = c.floor + 5 * (1 - easeOutBounce(k));
      }
      const s = root.userData.shake as number | undefined;
      root.rotation.z = s !== undefined && clock - s < 0.6 ? Math.sin((clock - s) * 40) * 0.015 * (1 - (clock - s) / 0.6) : 0;
    },
    count: () => ({ current: cups.length, max: slots.length, noun: 'Cups', fullLine: 'Full house.' }),
    reset() { for (const c of cups.splice(0)) root.remove(c.group); },
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
};
