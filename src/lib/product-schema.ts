import { z } from 'astro/zod';

export const PRODUCT_GLOB = '[!_]*/index.md';
export const MODEL_KINDS = ['medal-hanger', 'grid-shelf'] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];

const DOT_DATE = /^\d{4}\.(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/;

export function productSchema<I extends z.ZodTypeAny>(image: () => I) {
  return z.object({
    name: z.string().min(1),
    code: z.string().regex(/^HTR—[A-Z]{2,3}$/, 'Use the form HTR—XX with an em dash'),
    wordmark: z.string().regex(/\.$/, 'Wordmarks end with a full stop'),
    order: z.number().int(),
    audience: z.string().min(1),
    tagline: z.string().min(1),
    released: z.string().regex(DOT_DATE, 'Use a dot-date like 2026.AUG'),
    status: z.enum(['available', 'soon']).default('available'),
    category: z.string().optional(),
    hero: image(),
    heroAlt: z.string().min(1),
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
    reel: z.object({ file: z.string().regex(/\.(mp4|webm)$/), poster: image() }).optional(),
    model: z.enum(MODEL_KINDS).optional(),
  });
}
