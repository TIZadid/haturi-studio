import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { beforeAll, expect, it } from 'vitest';

beforeAll(() => execSync('npx astro build', { stdio: 'ignore' }));

it('Cloudflare serves product pages at the slash-less URLs the site links to', () => {
  // JSONC with no comments is valid YAML, so the yaml parser reads it
  const cfg = parse(readFileSync('wrangler.jsonc', 'utf8'));
  expect(cfg.assets.html_handling).toBe('drop-trailing-slash');
});

it('canonical URLs have no trailing slash', () => {
  const html = readFileSync('dist/products/medal-hanger/index.html', 'utf8');
  expect(html).toMatch(/<link rel="canonical" href="[^"]*\/products\/medal-hanger">/);
});
