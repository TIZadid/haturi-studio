import type * as T from 'three';
import { easeOutBounce, nearestIndex, railSlots, swingAngle } from '../layout';
import { tokenColor } from '../tokens';
import { makeWood } from '../wood';
import type { ModelFactory } from './types';

export const BOARD = { w: 14, h: 6, d: 0.75 };
export const RAIL = { len: 12, size: 0.75, standoff: 0.75, ys: [1.4, -1.4] };
const PER_RAIL = 8;
const DROP = 0.55;

export const createMedalHanger: ModelFactory = (ctx) => {
  const { THREE } = ctx;
  const root = new THREE.Group();
  // board sits high in the frame so medals have room to hang below it, like the photo
  root.position.y = 3;
  const disposables: Array<{ dispose(): void }> = [];
  const track = <X extends { dispose(): void }>(x: X) => (disposables.push(x), x);

  const tex = track(makeWood(THREE, {
    base: tokenColor('--color-accent-2-800'), dark: tokenColor('--color-accent-2-900'), light: tokenColor('--color-accent-2-600'), seed: 11,
  }));
  const wood = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0 }));
  const brass = track(new THREE.MeshStandardMaterial({ color: tokenColor('--color-accent-2-300'), metalness: 0.9, roughness: 0.3 }));

  const box = (w: number, h: number, d: number) => track(new THREE.BoxGeometry(w, h, d));
  const board = new THREE.Mesh(box(BOARD.w, BOARD.h, BOARD.d), wood);
  board.castShadow = board.receiveShadow = true;
  root.add(board);

  const zFront = BOARD.d / 2;
  for (const y of RAIL.ys) {
    const rail = new THREE.Mesh(box(RAIL.len, RAIL.size, RAIL.size), wood);
    rail.position.set(0, y, zFront + RAIL.standoff + RAIL.size / 2);
    rail.castShadow = true;
    root.add(rail);
    for (const x of [-RAIL.len / 2 + RAIL.size / 2, RAIL.len / 2 - RAIL.size / 2]) {
      const block = new THREE.Mesh(box(RAIL.size, RAIL.size, RAIL.standoff), wood);
      block.position.set(x, y, zFront + RAIL.standoff / 2);
      block.castShadow = true;
      root.add(block);
    }
  }
  for (const x of [-4, 4]) {
    const hook = new THREE.Mesh(track(new THREE.TorusGeometry(0.32, 0.05, 8, 24, Math.PI * 1.5)), brass);
    hook.position.set(x, BOARD.h / 2 + 0.3, 0);
    hook.rotation.z = Math.PI * 0.25;
    root.add(hook);
  }

  // medals: metal discs on ribbons, colours from the brand ramps only
  const slotsX = railSlots(RAIL.len, PER_RAIL, 0.8);
  const metals = ['--color-accent-2-400', '--color-neutral-300', '--color-accent-2-600'].map((n) =>
    track(new THREE.MeshStandardMaterial({ color: tokenColor(n), metalness: 0.85, roughness: 0.32 })));
  const ribbons = ['--color-accent-2-500', '--color-accent-700', '--color-neutral-700', '--color-accent-2-200', '--color-accent-2-700'].map((n) =>
    track(new THREE.MeshStandardMaterial({ color: tokenColor(n), roughness: 0.9, side: THREE.DoubleSide })));
  const discGeo = track(new THREE.CylinderGeometry(0.95, 0.95, 0.16, 48));
  const rimGeo = track(new THREE.TorusGeometry(0.95, 0.07, 10, 48));
  // each ribbon is two strips meeting in a V at the medal, like the real thing
  const strip = track(new THREE.PlaneGeometry(0.55, 4.3));
  strip.translate(0, -2.15, 0);

  type Medal = { group: T.Group; slot: number; born: number; railY: number };
  const medals: Medal[] = [];
  let clock = 0;
  const zRail = zFront + RAIL.standoff + RAIL.size + 0.05;

  function hang(slot: number, settled = false) {
    const railIdx = slot < PER_RAIL ? 0 : 1;
    const railY = RAIL.ys[railIdx] + RAIL.size / 2;
    const group = new THREE.Group();
    const ribbonMat = ribbons[slot % ribbons.length];
    const left = new THREE.Mesh(strip, ribbonMat);
    const right = new THREE.Mesh(strip, ribbonMat);
    left.position.x = -0.32; left.rotation.z = -0.07;
    right.position.x = 0.32; right.rotation.z = 0.07;
    const metal = metals[slot % metals.length];
    const disc = new THREE.Mesh(discGeo, metal);
    const rim = new THREE.Mesh(rimGeo, metal);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = rim.position.y = -4.9;
    for (const m of [left, right, disc, rim]) m.castShadow = true;
    group.add(left, right, disc, rim);
    group.position.set(slotsX[slot % PER_RAIL] + (railIdx ? 0.35 : 0), railY, zRail + railIdx * 0.2);
    root.add(group);
    medals.push({ group, slot, born: settled ? -100 : clock, railY });
  }

  // start with a few medals so it reads as a hanger in use, and invites the next tap
  for (const slot of [1, 4, 9]) hang(slot, true);

  return {
    root,
    size: { width: BOARD.w, height: BOARD.h + 10 },
    pick(point) {
      const used = new Set(medals.map((m) => m.slot));
      if (used.size >= PER_RAIL * 2) { root.userData.shake = clock; return; }
      const local = root.worldToLocal(point.clone());
      const railPref = local.y >= 0 ? 0 : 1;
      for (const r of [railPref, 1 - railPref]) {
        const skip = new Set([...used].filter((s) => Math.floor(s / PER_RAIL) === r).map((s) => s % PER_RAIL));
        const i = nearestIndex(slotsX, local.x, skip);
        if (i >= 0) { hang(r * PER_RAIL + i); ctx.changed(); return; }
      }
    },
    update(_dt, elapsed) {
      clock = elapsed;
      for (const m of medals) {
        const age = clock - m.born;
        if (ctx.reduced) { m.group.position.y = m.railY; m.group.rotation.x = 0; continue; }
        const k = Math.min(age / DROP, 1);
        m.group.position.y = m.railY + 6 * (1 - easeOutBounce(k));
        m.group.rotation.x = k < 1 ? 0 : swingAngle(age - DROP, 0.35);
      }
      const s = root.userData.shake as number | undefined;
      root.rotation.z = s !== undefined && clock - s < 0.6 ? Math.sin((clock - s) * 40) * 0.02 * (1 - (clock - s) / 0.6) : 0;
    },
    count: () => ({ current: medals.length, max: PER_RAIL * 2, noun: 'Medals', fullLine: "That's a good year." }),
    reset() { for (const m of medals.splice(0)) root.remove(m.group); },
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
};
