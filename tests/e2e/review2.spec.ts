import { expect, test } from '@playwright/test';

const pages = ['/', '/products/medal-hanger', '/products/grid-shelf'];

test.describe('owner review 2', () => {
  for (const path of pages) {
    test(`${path}: big titles fit their column and the screen`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(1500);
      const vw = page.viewportSize()!.width;
      for (const el of await page.locator('.wordmark, .h-hero, .h-section').all()) {
        const fits = await el.evaluate((n) => {
          const r = n.getBoundingClientRect();
          const p = n.parentElement!.getBoundingClientRect();
          return { overflow: n.scrollWidth - n.clientWidth, right: r.right, parentRight: p.right, left: r.left };
        });
        expect(fits.overflow, await el.textContent() ?? '').toBeLessThanOrEqual(1);
        expect(fits.right).toBeLessThanOrEqual(Math.min(vw, fits.parentRight) + 1);
        expect(fits.left).toBeGreaterThanOrEqual(-1);
      }
    });

    test(`${path}: shows no dates`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator('body').innerText()).not.toMatch(/\b20\d\d\.(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/);
    });
  }

  test('product pages have no In motion reel', async ({ page }) => {
    for (const path of pages.slice(1)) {
      await page.goto(path);
      await expect(page.locator('video')).toHaveCount(0);
      await expect(page.getByText('In motion.')).toHaveCount(0);
    }
  });

  test('every product is teak and the hanger holds 16+', async ({ page }) => {
    await page.goto('/products/medal-hanger');
    await expect(page.locator('.specs')).toContainText('Solid teak (Shegun)');
    await expect(page.locator('.specs')).toContainText('16+ medals');
    await page.goto('/products/grid-shelf');
    await expect(page.locator('.specs')).toContainText('Solid teak (Shegun)');
  });

  test('the Grid Shelf says it can be customised; the hanger does not', async ({ page }) => {
    await page.goto('/products/grid-shelf');
    await expect(page.locator('main')).toContainText(/customis/i);
    await page.goto('/products/medal-hanger');
    await expect(page.locator('main')).not.toContainText(/customis/i);
  });

  test('home shows the products right after the hero, then a photo bento', async ({ page }) => {
    await page.goto('/');
    const ids = await page.locator('main section[id]').evaluateAll((s) => s.map((n) => n.id));
    expect(ids.slice(0, 3)).toEqual(['top', 'products', 'bento']);
    const tiles = page.locator('#bento a[data-bento-tile]');
    expect(await tiles.count()).toBeGreaterThanOrEqual(8);
    const hrefs = new Set(await tiles.evaluateAll((a) => a.map((n) => n.getAttribute('href'))));
    expect([...hrefs].sort()).toEqual(['/products/grid-shelf', '/products/medal-hanger']);
  });

  test('menu lists every product and links to its page', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.locator(isMobile ? 'header [data-menu-mobile] summary' : 'header [data-menu-products] summary').click();
    const scope = page.locator(isMobile ? 'header [data-menu-mobile]' : 'header [data-menu-products]');
    await expect(scope.locator('a[href="/products/medal-hanger"]')).toBeVisible();
    await expect(scope.locator('a[href="/products/grid-shelf"]')).toBeVisible();
    await scope.locator('a[href="/products/grid-shelf"]').click();
    await expect(page.locator('h1')).toHaveText('Grid Shelf.');
  });

  test('section links land on the right section, even from a product page', async ({ page, isMobile }) => {
    await page.goto('/products/grid-shelf');
    if (isMobile) await page.locator('header [data-menu-mobile] summary').click();
    const scope = isMobile ? 'header [data-menu-mobile]' : 'header nav';
    await page.locator(`${scope} a[href="/#craft"]`).click();
    // the 3D viewer renders on the CPU in CI; give the page swap time
    await expect(page).toHaveURL(/#craft$/, { timeout: 15_000 });
    await page.waitForTimeout(1500);
    const top = await page.locator('#craft').evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(120);
  });
});
