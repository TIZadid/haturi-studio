import { expect, test } from '@playwright/test';

test.describe('owner review fixes', () => {
  test('every DM call to action offers Instagram and Messenger', async ({ page }) => {
    await page.goto('/');
    for (const id of ['#top', '#order']) {
      await expect(page.locator(`${id} a[data-dm="instagram"]`)).toHaveAttribute('href', 'https://ig.me/m/haturistudio');
      await expect(page.locator(`${id} a[data-dm="messenger"]`)).toHaveAttribute('href', 'https://m.me/haturistudio');
      await expect(page.locator(`${id} a[data-dm="messenger"]`)).toBeVisible();
    }
  });

  test('header DM menu reveals both channels', async ({ page }) => {
    await page.goto('/');
    await page.locator('header [data-dm-menu] summary').click();
    await expect(page.locator('header a[data-dm="instagram"]')).toBeVisible();
    await expect(page.locator('header a[data-dm="messenger"]')).toBeVisible();
  });

  test('footer says Haturi Studio', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer .wordmark')).toHaveText('Haturi Studio.');
  });

  test('hero gives both products equal billing', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('#top a[data-hero-panel]').evaluateAll((a) => a.map((n) => n.getAttribute('href')));
    expect(hrefs.sort()).toEqual(['/products/grid-shelf', '/products/medal-hanger']);
  });

  test('header switches to light ink over the dark order section', async ({ page, isMobile }) => {
    test.skip(isMobile, 'same logic; desktop has the pin that shifts positions');
    await page.goto('/');
    await page.waitForTimeout(800);
    const top = await page.locator('#order').evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y + 200), top);
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, -40);
    await page.waitForTimeout(600);
    await expect(page.locator('header')).toHaveAttribute('data-on-dark', '');
  });

  test('the native cursor is never hidden', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(300, 300);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).cursor)).not.toBe('none');
    expect(await page.locator('a').first().evaluate((a) => getComputedStyle(a).cursor)).not.toBe('none');
  });

  test('craft shows the making sequence from log to finished piece', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#craft [data-step-craft]')).toHaveCount(4);
    await expect(page.locator('#craft video')).toHaveCount(0);
  });
});
