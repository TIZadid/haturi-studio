import { getCollection } from 'astro:content';
import { sortProducts } from './catalog';

export const videoMap = import.meta.glob<string>('/src/content/products/*/*.{mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export async function getProducts() {
  return sortProducts(await getCollection('products'));
}
