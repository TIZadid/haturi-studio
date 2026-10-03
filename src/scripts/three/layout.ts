export function railSlots(length: number, count: number, inset: number): number[] {
  if (count < 1) return [];
  if (count === 1) return [0];
  const usable = length - inset * 2;
  const step = usable / (count - 1);
  return Array.from({ length: count }, (_, i) => -usable / 2 + i * step);
}

export function gridSlots(o: { width: number; height: number; rows: number; cols: number; frame: number }) {
  const cw = (o.width - 2 * o.frame) / o.cols;
  const ch = (o.height - 2 * o.frame) / o.rows;
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < o.rows; r++)
    for (let c = 0; c < o.cols; c++)
      out.push({ x: -o.width / 2 + o.frame + cw * (c + 0.5), y: o.height / 2 - o.frame - ch * (r + 0.5) });
  return out;
}

export function nextFree(occupied: ReadonlySet<number>, total: number, preferred?: number): number | null {
  if (preferred !== undefined && preferred >= 0 && preferred < total && !occupied.has(preferred)) return preferred;
  for (let i = 0; i < total; i++) if (!occupied.has(i)) return i;
  return null;
}

export function nearestIndex(values: readonly number[], v: number, skip: ReadonlySet<number> = new Set()): number {
  let best = -1;
  let bestD = Infinity;
  values.forEach((x, i) => {
    if (skip.has(i)) return;
    const d = Math.abs(x - v);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export const swingAngle = (t: number, amplitude: number, omega = 6, damping = 2.2) =>
  amplitude * Math.exp(-damping * t) * Math.cos(omega * t);

export function easeOutBounce(x: number): number {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}

export function fitDistance(width: number, height: number, fovDeg: number, aspect: number, margin = 1.2): number {
  const half = Math.tan(((fovDeg / 2) * Math.PI) / 180);
  return Math.max(height / 2 / half, width / 2 / (half * aspect)) * margin;
}

/** Cross-lap pegs at every inner column line: one on each shelf, and one tucked under the top and above the bottom frame. */
export function pegPositions(o: { width: number; height: number; rows: number; cols: number; frame: number; pegHeight: number }) {
  const rowH = (o.height - 2 * o.frame) / o.rows;
  const colW = (o.width - 2 * o.frame) / o.cols;
  const inner = o.height / 2 - o.frame;
  const ys = [inner - o.pegHeight / 2];
  for (let r = 1; r < o.rows; r++) ys.push(inner - rowH * r);
  ys.push(-inner + o.pegHeight / 2);
  const xs = Array.from({ length: o.cols - 1 }, (_, c) => -o.width / 2 + o.frame + colW * (c + 1));
  return ys.flatMap((y) => xs.map((x) => ({ x, y })));
}
