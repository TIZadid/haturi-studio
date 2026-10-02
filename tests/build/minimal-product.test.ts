import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { afterAll, expect, it } from 'vitest';

const dest = 'src/content/products/zz-minimal-test';
afterAll(() => { rmSync(dest, { recursive: true, force: true }); execSync('npx astro build', { stdio: 'ignore' }); });

it('a product folder with only required fields builds a clean page', () => {
  cpSync('tests/fixtures/minimal-product', dest, { recursive: true });
  execSync('npx astro build', { stdio: 'inherit' });
  const html = readFileSync('dist/products/zz-minimal-test/index.html', 'utf8');
  expect(html).toContain('Test.');
  expect(html).not.toContain('data-gallery-track');
  expect(html).not.toContain('<video');
  expect(html).not.toContain('data-callout');
  expect(html).not.toContain('data-viewer=');
  expect(existsSync('dist/index.html')).toBe(true);
  expect(readFileSync('dist/index.html', 'utf8')).toContain('/products/zz-minimal-test');
});
