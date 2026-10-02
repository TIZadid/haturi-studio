import { expect, test } from '@playwright/test';

test('medal hanger viewer mounts one canvas over the photo', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  const viewer = page.locator('[data-viewer="medal-hanger"]');
  await expect(viewer).toHaveAttribute('data-ready', '', { timeout: 30_000 });
  await expect(viewer.locator('canvas')).toHaveCount(1);
});

test('vertical swipe over the viewer scrolls the page', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch only');
  await page.goto('/products/medal-hanger');
  const viewer = page.locator('[data-viewer]');
  await expect(viewer).toHaveAttribute('data-ready', '', { timeout: 30_000 });
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

for (const [id, max] of [['medal-hanger', 14], ['grid-shelf', 16]] as const) {
  test(`${id}: taps add pieces up to ${max}, reset clears`, async ({ page }) => {
    await page.goto(`/products/${id}`);
    const viewer = page.locator(`[data-viewer="${id}"]`);
    await expect(viewer).toHaveAttribute('data-ready', '', { timeout: 30_000 });
    const canvas = viewer.locator('canvas');
    const box = (await canvas.boundingBox())!;
    // 35% down hits the hanger board (it sits high in frame) and the shelf's upper rows
    for (let i = 0; i < max + 2; i++) await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.35);
    await expect(viewer).toHaveAttribute('data-count', String(max));
    await expect(viewer.locator('[data-viewer-count]')).toContainText(`${max} / ${max}`);
    await viewer.locator('[data-viewer-reset]').click();
    await expect(viewer).toHaveAttribute('data-count', '0');
  });
}
