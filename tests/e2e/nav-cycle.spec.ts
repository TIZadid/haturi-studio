import { expect, test } from '@playwright/test';

test('navigation cycles keep one canvas and clean scroll triggers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  for (let i = 0; i < 2; i++) {
    await page.locator('#products a[data-product]').first().click();
    await expect(page.locator('h1')).toHaveText('Hanger.');
    await expect(page.locator('[data-viewer]')).toHaveAttribute('data-ready', '', { timeout: 30_000 });
    await page.locator('a[data-next]').click();
    await expect(page.locator('h1')).toHaveText('Grid.');
    await expect(page.locator('[data-viewer]')).toHaveAttribute('data-ready', '', { timeout: 30_000 });
    await expect(page.locator('canvas')).toHaveCount(1);
    // ClientRouter swaps after goBack resolves; wait for each page before the next step
    await page.goBack();
    await expect(page.locator('h1')).toHaveText('Hanger.');
    await page.goBack();
    await expect(page.locator('#products')).toBeAttached();
  }
  await expect(page.locator('header')).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  await expect(page.locator('header')).toHaveAttribute('data-on-dark', '');
  expect(await page.locator('.pin-spacer').count()).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
