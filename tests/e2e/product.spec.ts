import { expect, test } from '@playwright/test';

for (const [id, word, other] of [['medal-hanger', 'Medal Hanger.', 'grid-shelf'], ['grid-shelf', 'Grid Shelf.', 'medal-hanger']]) {
  test.describe(id, () => {
    test('renders hero, specs, gallery, reel and next link', async ({ page }) => {
      await page.goto(`/products/${id}`);
      await expect(page.locator('h1')).toHaveText(word);
      await expect(page.locator('[data-viewer]')).toBeVisible();
      expect(await page.locator('.specs dt').count()).toBeGreaterThan(2);
      expect(await page.locator('[data-callout]').count()).toBeGreaterThan(0);
      expect(await page.locator('[data-gallery-track] figure').count()).toBeGreaterThan(0);
      await expect(page.locator('a[data-next]')).toHaveAttribute('href', `/products/${other}`);
      await expect(page.locator('main a[data-dm="instagram"]').first()).toBeVisible();
    });
  });
}

test('card click navigates with view transition and back returns home', async ({ page }) => {
  await page.goto('/');
  await page.locator('#products a[data-product]').first().click();
  await expect(page).toHaveURL(/\/products\//);
  await expect(page.locator('h1')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#products')).toBeAttached();
});

test('unknown product is a 404 with a way home', async ({ page }) => {
  const res = await page.goto('/products/chair');
  expect(res?.status()).toBe(404);
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});

test('first screen shows the wordmark and the product photo', async ({ page, isMobile }) => {
  await page.goto('/products/medal-hanger');
  const vh = page.viewportSize()!.height;
  const h1 = (await page.locator('h1').boundingBox())!;
  expect(h1.y + h1.height).toBeLessThan(vh);
  const viewer = (await page.locator('[data-viewer]').boundingBox())!;
  const img = (await page.locator('[data-viewer] img').boundingBox())!;
  expect(Math.abs(img.y - viewer.y)).toBeLessThan(2);
  if (!isMobile) {
    expect(img.y).toBeLessThan(vh * 0.4);
    const dm = (await page.locator('main a[data-dm="instagram"]').first().boundingBox())!;
    expect(dm.y + dm.height).toBeLessThan(vh);
  }
});

test('silent reels do not offer a sound toggle', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  await expect(page.locator('[data-reel]')).toHaveCount(1);
  await expect(page.locator('[data-reel-sound]')).toHaveCount(0);
});

test('medal hanger page draws its sketch, labelled Teak / Shegun', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  const sketch = page.locator('[data-sketch]');
  await expect(sketch).toHaveCount(1);
  await expect(sketch.locator('[data-sketch-label]')).toContainText(['Teak / Shegun']);
  await sketch.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 1600);
  await page.waitForTimeout(1500);
  const clip = await sketch.locator('[data-sketch-draw]').evaluate((el) => getComputedStyle(el).clipPath);
  expect(['none', 'inset(0px)', 'inset(0px 0% 0px 0px)', 'inset(0px 0px 0px 0px)']).toContain(clip);
});

test('products without a sketch show no sketch section', async ({ page }) => {
  await page.goto('/products/grid-shelf');
  await expect(page.locator('[data-sketch]')).toHaveCount(0);
});

test('the whole sketch and its labels fit on screen while pinned', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pin is desktop only');
  await page.setViewportSize({ width: 1440, height: 760 }); // a common laptop height
  await page.goto('/products/medal-hanger');
  const top = await page.locator('[data-sketch]').evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y + 600), top);
  await page.waitForTimeout(1200);
  const vh = page.viewportSize()!.height;
  for (const pill of await page.locator('[data-sketch-label]').all()) {
    const b = (await pill.boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.y + b.height).toBeLessThanOrEqual(vh);
  }
});
