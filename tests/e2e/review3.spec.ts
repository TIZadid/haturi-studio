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

test('the next-piece link opens the other product at the top', async ({ page, isMobile }) => {
  await page.goto('/products/medal-hanger');
  await page.waitForTimeout(800);
  const next = page.locator('a[data-next]');
  // scroll down like a person does: wheel on desktop, finger swipes on a phone
  const cdp = isMobile ? await page.context().newCDPSession(page) : null;
  for (let i = 0; i < 60 && !(await next.isVisible() && (await next.boundingBox())!.y < page.viewportSize()!.height - 120); i++) {
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 600 }] });
      for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 600 - k * 70 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else await page.mouse.wheel(0, 900);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(500);
  if (cdp) await next.tap(); else await next.click();
  await expect(page.locator('h1')).toHaveText('Grid Shelf.');
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(5);
});

test('tapping next while the page is still gliding still lands at the top', async ({ page, isMobile }) => {
  test.skip(isMobile, 'smooth glide is the desktop path; phones covered above');
  await page.goto('/products/medal-hanger');
  await page.waitForTimeout(800);
  const next = page.locator('a[data-next]');
  const y = await next.evaluate((el) => el.getBoundingClientRect().top + scrollY - 200);
  await page.evaluate((y) => scrollTo(0, y), y);
  await page.waitForTimeout(600);
  // start a long glide, then tap the link before it settles
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, -300);
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(60);
  await page.evaluate(() => (document.querySelector('a[data-next]') as HTMLAnchorElement).click());
  await expect(page.locator('h1')).toHaveText('Grid Shelf.');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(5);
});
