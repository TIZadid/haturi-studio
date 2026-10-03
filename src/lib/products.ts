import { getCollection } from 'astro:content';
import { sortProducts } from './catalog';

export async function getProducts() {
  return sortProducts(await getCollection('products'));
}
