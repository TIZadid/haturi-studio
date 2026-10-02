import { tokenColor } from '../tokens';
import { makeWood } from '../wood';
import type { ModelFactory } from './types';

export const BOARD = { w: 14, h: 6, d: 0.75 };
export const RAIL = { len: 12, size: 0.75, standoff: 0.75, ys: [1.4, -1.4] };

export const createMedalHanger: ModelFactory = ({ THREE }) => {
  const root = new THREE.Group();
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
    rail.userData.rail = y;
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

  return {
    root,
    size: { width: BOARD.w, height: BOARD.h + 1 },
    pick() {},
    update() {},
    count: () => ({ current: 0, max: 14, noun: 'Medals', fullLine: "That's a good year." }),
    reset() {},
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
};
