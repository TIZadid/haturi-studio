import { expect, test } from '@playwright/test';

for (const [id, word, other] of [['medal-hanger', 'Hanger.', 'grid-shelf'], ['grid-shelf', 'Grid.', 'medal-hanger']]) {
  test.describe(id, () => {
    test('renders hero, specs, gallery, reel and next link', async ({ page }) => {
      await page.goto(`/products/${id}`);
      await expect(page.locator('h1')).toHaveText(word);
      await expect(page.locator('[data-viewer]')).toBeVisible();
      expect(await page.locator('.specs dt').count()).toBeGreaterThan(2);
      expect(await page.locator('[data-callout]').count()).toBeGreaterThan(0);
      expect(await page.locator('[data-gallery-track] figure').count()).toBeGreaterThan(0);
      await expect(page.locator('a[data-next]')).toHaveAttribute('href', `/products/${other}`);
      await expect(page.locator('main a[data-dm]').first()).toBeVisible();
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
    const dm = (await page.locator('main a[data-dm]').first().boundingBox())!;
    expect(dm.y + dm.height).toBeLessThan(vh);
  }
});
