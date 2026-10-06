import { expect, test } from '@playwright/test';

// every label sits right beside the point it names, and inside its picture
async function checkPins(page: import('@playwright/test').Page, frame: string, pin: string, dot: string, pill: string) {
  const f = page.locator(frame);
  await f.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const fb = (await f.boundingBox())!;
  const pins = await page.locator(pin).all();
  expect(pins.length).toBeGreaterThan(2);
  for (const p of pins) {
    const d = (await p.locator(dot).boundingBox())!;
    const l = (await p.locator(pill).boundingBox())!;
    const gap = Math.max(l.y - (d.y + d.height), d.y - (l.y + l.height), 0);
    expect(gap, await p.locator(pill).textContent() ?? '').toBeLessThanOrEqual(44);
    expect(l.x).toBeGreaterThanOrEqual(fb.x - 1);
    expect(l.x + l.width).toBeLessThanOrEqual(fb.x + fb.width + 1);
    expect(l.y).toBeGreaterThanOrEqual(fb.y - 1);
    expect(l.y + l.height).toBeLessThanOrEqual(fb.y + fb.height + 1);
  }
}

for (const id of ['medal-hanger', 'grid-shelf']) {
  test(`${id}: material labels sit close to their points on a close-up photo`, async ({ page }) => {
    await page.goto(`/products/${id}`);
    await expect(page.locator('.ann__figure img')).toHaveAttribute('src', /closeup/);
    await checkPins(page, '.ann__figure', '[data-callout]', '.callout__dot', '[data-callout-pill]');
  });
}

test('the sketch labels sit on the drawing, close to their points, with no list below', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  await page.locator('[data-sketch]').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 1600);
  await checkPins(page, '.sketch__paper', '[data-sketch-pin]', '.pin__dot', '[data-sketch-label]');
  await expect(page.locator('.sketch__list')).toBeHidden();
});
