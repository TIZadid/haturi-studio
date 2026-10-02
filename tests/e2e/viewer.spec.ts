import { expect, test } from '@playwright/test';

test('medal hanger viewer mounts one canvas over the photo', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  const viewer = page.locator('[data-viewer="medal-hanger"]');
  await expect(viewer).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  await expect(viewer.locator('canvas')).toHaveCount(1);
});

test('vertical swipe over the viewer scrolls the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch only');
  await page.goto('/products/medal-hanger');
  const viewer = page.locator('[data-viewer]');
  await expect(viewer).toHaveAttribute('data-ready', '', { timeout: 15_000 });
  const box = (await viewer.locator('canvas').boundingBox())!;
  const before = await page.evaluate(() => scrollY);
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2, y = box.y + box.height * 0.4;
  // raw touch events: Input.synthesizeScrollGesture does not scroll in headless shell at all
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 30 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
});
