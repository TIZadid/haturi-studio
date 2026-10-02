import { expect, test } from '@playwright/test';

test('home renders with brand title and self-hosted fonts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await expect(page).toHaveTitle(/Haturi Studio/);
  const family = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('Archivo');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('800 40px Archivo'))).toBe(true);
  expect(errors).toEqual([]);
});
