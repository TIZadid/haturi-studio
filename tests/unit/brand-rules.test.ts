import { readFileSync } from 'node:fs';
import { globSync } from 'tinyglobby';
import { describe, expect, it } from 'vitest';

const files = globSync(['src/**/*.{astro,css,ts}'], { ignore: ['src/styles/tokens.css'] });
const copy = globSync(['src/content/**/*.md', 'src/**/*.astro']);
const read = (f: string) => readFileSync(f, 'utf8');

describe('brand rules (website-handoff/README.md "Never")', () => {
  it('finds source files to check', () => expect(files.length).toBeGreaterThan(0));

  it.each(files)('%s has no colour literals outside tokens.css', (f) => {
    expect(read(f)).not.toMatch(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])|\brgba?\(/);
  });
  it.each(files)('%s has no gradients or CSS shadows', (f) => {
    const src = read(f);
    expect(src).not.toMatch(/gradient\(/);
    expect(src).not.toMatch(/(box|text)-shadow\s*:\s*(?!none)/);
  });
  it.each(copy)('%s has no emoji', (f) => {
    expect(read(f)).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it.each(globSync(['src/content/**/*.md']))('%s copy has no exclamation marks', (f) => {
    expect(read(f).replace(/^---[\s\S]*?---/, '')).not.toContain('!');
  });
});
