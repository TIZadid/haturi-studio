import { expect, test } from '@playwright/test';

test('clicking the footer wordmark glides back to the top', async ({ page }) => {
  await page.goto('/products/grid-shelf');
  const word = page.locator('footer [data-to-top]');
  await word.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500);
  await word.click();
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBeLessThan(5);
});

test('hovering either hammer makes it strike', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover only; phones get it on tap');
  await page.goto('/');
  await page.waitForTimeout(2500);
  for (const sel of ['header .brand', '#top [data-hero-mark]']) {
    await page.locator(sel).hover();
    const name = await page.locator(sel === 'header .brand' ? 'header .mark:visible' : sel).first().evaluate((el) => getComputedStyle(el).animationName);
    expect(name, sel).toContain('hammer-strike');
  }
});

test('big titles keep their descenders inside their own box', async ({ page }) => {
  await page.goto('/products/medal-hanger');
  const pad = await page.locator('h1.wordmark').evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom) / parseFloat(getComputedStyle(el).fontSize));
  expect(pad).toBeGreaterThanOrEqual(0.2);
});
