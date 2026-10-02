import { expect, test } from '@playwright/test';

test.describe('site chrome', () => {
  test('header DM link goes to Instagram DM in a new tab', async ({ page }) => {
    await page.goto('/');
    const dm = page.locator('header a[data-dm]');
    await expect(dm).toHaveAttribute('href', /^https:\/\/ig\.me\/m\/[a-z0-9._]+$/);
    await expect(dm).toHaveAttribute('target', '_blank');
    await expect(dm).toHaveAttribute('rel', /noopener/);
  });

  test('footer shows wordmark and instagram handle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer .wordmark')).toHaveText('Haturi.');
    await expect(page.locator('footer a[href*="instagram.com"]')).toBeVisible();
  });

  test('no horizontal page scroll and no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test('reduced motion leaves revealed content fully visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    for (const el of await page.locator('[data-reveal]').all()) {
      await el.scrollIntoViewIfNeeded();
      expect(Number(await el.evaluate((n) => getComputedStyle(n).opacity))).toBe(1);
    }
  });
});
