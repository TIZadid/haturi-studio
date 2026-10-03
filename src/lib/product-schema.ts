import { z } from 'astro/zod';

export const PRODUCT_GLOB = '[!_]*/index.md';
export const MODEL_KINDS = ['medal-hanger', 'grid-shelf'] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];

export function productSchema<I extends z.ZodTypeAny>(image: () => I) {
  return z.object({
    name: z.string().min(1),
    code: z.string().regex(/^HTR—[A-Z]{2,3}$/, 'Use the form HTR—XX with an em dash'),
    wordmark: z.string().regex(/\.$/, 'Wordmarks end with a full stop'),
    order: z.number().int(),
    audience: z.string().min(1),
    tagline: z.string().min(1),
    status: z.enum(['available', 'soon']).default('available'),
    category: z.string().optional(),
    // short line shown on the card and product page, e.g. that a piece can be customised
    note: z.string().optional(),
    hero: image(),
    heroAlt: z.string().min(1),
    // optional high-resolution photo for the home hero panel; falls back to hero
    cover: image().optional(),
    gallery: z.array(z.object({ src: image(), alt: z.string().min(1) })).default([]),
    specs: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).min(1),
    callouts: z
      .array(z.object({
        label: z.string().min(1),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        side: z.enum(['up', 'down']).default('up'),
      }))
      .default([]),
    // optional line drawing that draws itself on scroll, with labels on leader lines (x/y in % of the drawing)
    sketch: z.object({
      src: image(),
      caption: z.string().min(1),
      labels: z.array(z.object({
        label: z.string().min(1),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        side: z.enum(['up', 'down']).default('up'),
      })).default([]),
    }).optional(),
    model: z.enum(MODEL_KINDS).optional(),
  });
}
