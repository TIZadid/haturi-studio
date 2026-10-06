import { expect, test } from '@playwright/test';

test('big titles never hang out of their sizing box (Safari clips there)', async ({ page }) => {
  for (const path of ['/', '/products/medal-hanger']) {
    await page.goto(path);
    for (const el of await page.locator('.fit > .wordmark, .fit .wordmark').all()) {
      const [own, box] = await el.evaluate((n) => {
        const fit = n.closest('.fit')!;
        return [n.getBoundingClientRect().bottom, fit.getBoundingClientRect().bottom];
      });
      expect(own, `${path} ${await el.textContent()}`).toBeLessThanOrEqual(box + 0.5);
    }
  }
});

test('the header carries no glow and the open menu text is crisp', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['header', 'header .brand', 'header [data-menu-mobile] .sheet__name']) {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) continue;
    expect(await loc.evaluate((n) => getComputedStyle(n).textShadow), sel).toBe('none');
  }
});

test('the header sits on a solid bar once you scroll, so it reads over anything', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(800);
  const bg = await page.locator('header [data-header-bar]').evaluate((n) => getComputedStyle(n).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('material labels sit on the photo, not in a list below', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  const fig = (await page.locator('.ann__figure').boundingBox())!;
  const pills = page.locator('[data-callout-pill]');
  expect(await pills.count()).toBe(3);
  for (const p of await pills.all()) {
    await p.scrollIntoViewIfNeeded();
    await expect(p).toBeVisible();
    const b = (await p.boundingBox())!;
    const f = (await page.locator('.ann__figure').boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(f.x - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(f.x + f.width + 1);
  }
  await expect(page.locator('.ann__list')).toBeHidden();
  expect(fig.width).toBeGreaterThan(0);
});

test('the photo slider starts inside the page margin on phones', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones scroll the gallery sideways');
  await page.goto('/products/medal-hanger');
  const first = page.locator('[data-gallery-track] figure').first();
  await first.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  expect((await first.boundingBox())!.x).toBeGreaterThanOrEqual(15);
});
