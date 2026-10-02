import type * as T from 'three';

export interface ModelContext {
  THREE: typeof T;
  reduced: boolean;
  /** Call after the count changes so the viewer updates its caption. */
  changed: () => void;
}

export interface ModelHandle {
  root: T.Object3D;
  /** Model size in scene units (inches), used to frame the camera. */
  size: { width: number; height: number };
  /** Called with the world-space point of a click on the model. */
  pick(point: T.Vector3): void;
  update(dt: number, elapsed: number): void;
  count(): { current: number; max: number; noun: string; fullLine: string };
  reset(): void;
  dispose(): void;
}

export type ModelFactory = (ctx: ModelContext) => ModelHandle;
