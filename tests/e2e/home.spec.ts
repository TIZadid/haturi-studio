import { expect, test } from '@playwright/test';

test.describe('home', () => {
  test('sections appear in the handoff order', async ({ page }) => {
    await page.goto('/');
    const ids = await page.locator('main section[id]').evaluateAll((s) => s.map((n) => n.id));
    expect(ids).toEqual(['top', 'problem', 'products', 'craft', 'order']);
  });

  test('one product row per product folder, linking to its page', async ({ page }) => {
    const { globSync } = await import('tinyglobby');
    const { PRODUCT_GLOB } = await import('../../src/lib/product-schema');
    const ids = globSync(PRODUCT_GLOB, { cwd: 'src/content/products' }).map((f) => f.split('/')[0]).sort();
    await page.goto('/');
    const hrefs = await page.locator('#products a[data-product]').evaluateAll((a) => a.map((n) => n.getAttribute('href')));
    expect(hrefs.map((h) => h!.replace('/products/', '')).sort()).toEqual(ids);
  });

  test('craft section has the title and the pencil drawing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#craft h2')).toHaveText('Haturi means hammer.');
    await expect(page.locator('#craft img[alt*="drawing"]')).toHaveCount(1);
  });

  test('how to order has three steps and a DM button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#order [data-step]')).toHaveCount(3);
    await expect(page.locator('#order a[data-dm="instagram"]')).toBeVisible();
  });

  test('hero has the brand name as h1 and a DM button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#top h1')).toHaveAccessibleName('Haturi Studio');
    await expect(page.locator('#top a[data-dm="instagram"]')).toBeVisible();
  });

  test('each hero photo fills its panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1600);
    for (const panel of await page.locator('#top [data-hero-panel]').all()) {
      const box = (await panel.boundingBox())!;
      const img = (await panel.locator('img').boundingBox())!;
      expect(img.height).toBeGreaterThanOrEqual(box.height - 1);
      expect(img.width).toBeGreaterThanOrEqual(box.width - 1);
    }
  });

  test('problem pile settles into a grid after scrolling through', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pile animation is desktop only');
    await page.goto('/');
    await page.locator('#problem').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(1500);
    const rotations = await page.locator('[data-pile-item]').evaluateAll((els) =>
      els.map((el) => new DOMMatrix(getComputedStyle(el).transform).b));
    expect(rotations).toHaveLength(6);
    rotations.forEach((b) => expect(Math.abs(b)).toBeLessThan(0.02));
  });

  test('while pinned, problem copy is visible and the pile sits in view', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pin is desktop only');
    await page.goto('/');
    await page.waitForTimeout(800);
    const top = await page.locator('#problem').evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y + 10), top);
    await page.waitForTimeout(1200);
    expect(Number(await page.locator('#problem h2').evaluate((n) => getComputedStyle(n).opacity))).toBe(1);
    const centres = await page.locator('[data-pile-item]').evaluateAll((els) =>
      els.map((el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }));
    for (const [x, y] of centres) {
      expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(1440);
      expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(900);
    }
  });

  test('reveals below a pinned section fire on arrival, not a pin-length late', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pin is desktop only');
    await page.goto('/');
    await page.waitForTimeout(800);
    const target = page.locator('footer .wordmark');
    const top = await target.evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y - innerHeight * 0.6), top);
    await page.waitForTimeout(1500);
    expect(Number(await target.evaluate((n) => getComputedStyle(n).opacity))).toBeGreaterThan(0.9);
  });
});
