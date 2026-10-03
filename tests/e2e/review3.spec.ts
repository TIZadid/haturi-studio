import { expect, test } from '@playwright/test';

test('choosing any menu option closes the menu', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.waitForTimeout(800);
  const menu = page.locator(isMobile ? 'header [data-menu-mobile]' : 'header [data-menu-products]');
  await menu.locator('summary').click();
  await expect(menu).toHaveAttribute('open', '');
  // a same-page section link: the one that used to leave the menu open
  await menu.locator('a[href="/#products"]').click();
  await expect(menu).not.toHaveAttribute('open', '');
});

test('product pages keep a DM option on screen while scrolling', async ({ page }) => {
  await page.goto('/products/grid-shelf');
  const bar = page.locator('[data-sticky-dm]');
  await page.waitForTimeout(800);
  await expect(bar).toHaveAttribute('data-hidden', '');
  await page.mouse.wheel(0, 2200);
  await page.waitForTimeout(1200);
  await expect(bar).not.toHaveAttribute('data-hidden', '');
  await expect(bar.locator('a[data-dm="instagram"]')).toBeVisible();
  await expect(bar.locator('a[data-dm="messenger"]')).toBeVisible();
  const box = (await bar.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
});

test('header text has a halo in the ground colour so it reads over anything', async ({ page }) => {
  await page.goto('/');
  const shadow = await page.locator('header').evaluate((el) => getComputedStyle(el).textShadow);
  expect(shadow).not.toBe('none');
});
