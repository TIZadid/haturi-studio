import type { ModelKind } from '../../../lib/product-schema';
import type { ModelFactory } from './types';

export const models: Record<ModelKind, () => Promise<ModelFactory>> = {
  'medal-hanger': () => import('./medal-hanger').then((m) => m.createMedalHanger),
  'grid-shelf': () => import('./grid-shelf').then((m) => m.createGridShelf),
};
