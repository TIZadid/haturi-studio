import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('home content is visible without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer .wordmark')).toBeVisible();
  for (const el of await page.locator('[data-reveal]').all()) {
    expect(Number(await el.evaluate((n) => getComputedStyle(n).opacity))).toBe(1);
  }
});
