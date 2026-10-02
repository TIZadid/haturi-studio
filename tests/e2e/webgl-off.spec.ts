import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'] } });

test('without WebGL the product photo stays and nothing errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/products/medal-hanger');
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-viewer] canvas')).toHaveCount(0);
  await expect(page.locator('[data-viewer] img')).toBeVisible();
  expect(errors).toEqual([]);
});
