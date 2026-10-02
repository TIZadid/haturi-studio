import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { globSync } from 'tinyglobby';
import { beforeAll, expect, it } from 'vitest';

beforeAll(() => execSync('npx astro build', { stdio: 'ignore' }));

it('every file is under the Cloudflare 25 MiB asset limit', () => {
  for (const f of globSync('dist/**/*')) expect(statSync(f).size, f).toBeLessThan(25 * 1024 * 1024);
});

it('home does not load Three.js up front', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  const scripts = [...html.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.js)"/g)].map((m) => m[1]);
  expect(scripts.length).toBeGreaterThan(0);
  for (const s of scripts) expect(readFileSync(`dist${s}`, 'utf8'), s).not.toContain('WebGLRenderer');
});

it('home ships under 1.5 MB of html, css and js', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.(?:js|css))"/g)].map((m) => `dist${m[1]}`);
  const total = ['dist/index.html', ...new Set(assets)].reduce((n, f) => n + statSync(f).size, 0);
  expect(total).toBeLessThan(1.5 * 1024 * 1024);
});

it('no inspo images were published', () => {
  expect(globSync('dist/**/*inspo*')).toEqual([]);
});

it('_headers is published with long caching for hashed assets', () => {
  const h = readFileSync('dist/_headers', 'utf8');
  expect(h).toMatch(/\/_astro\/\*\s+Cache-Control: public, max-age=31536000, immutable/);
});
