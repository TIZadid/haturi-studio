interface Sortable { id: string; data: { order: number; name: string } }

export function sortProducts<T extends Sortable>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

export function neighbours<T extends { id: string }>(list: readonly T[], id: string): { prev: T; next: T } | null {
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const n = list.length;
  return { prev: list[(i - 1 + n) % n], next: list[(i + 1) % n] };
}

export function mediaUrl(map: Record<string, string>, id: string, file?: string): string | undefined {
  if (!file) return undefined;
  const key = `/src/content/products/${id}/${file}`;
  const url = map[key];
  if (!url) throw new Error(`Product "${id}" lists ${file}, but ${key} does not exist`);
  return url;
}
