import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { PRODUCT_GLOB, productSchema } from './lib/product-schema';

const products = defineCollection({
  loader: glob({
    pattern: PRODUCT_GLOB,
    base: './src/content/products',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) => productSchema(image),
});

export const collections = { products };
