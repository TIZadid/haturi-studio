# Haturi Studio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal, highly interactive static site for Haturi Studio with folder-per-product content, 3D product models, and scroll-driven motion, deployable free on Cloudflare Pages.

**Architecture:** Astro 5 static site in `site/`. Products are an Astro content collection: one folder per product (`src/content/products/<slug>/index.md` + photos + optional reel), validated by a pure zod schema. Motion is GSAP/ScrollTrigger + Lenis behind a small page-lifecycle module that survives ClientRouter navigations. 3D is Three.js, dynamically imported only when a viewer scrolls into view, with procedural models keyed by a `model` field.

**Tech Stack:** Node 20 (nvm), Astro 5, TypeScript strict, GSAP 3 + ScrollTrigger, Lenis 1, Three.js, Fontsource, Vitest 3, Playwright, ffmpeg-static, tinyglobby.

**Spec:** `docs/superpowers/specs/2026-10-02-haturi-website-design.md` (plus `website-handoff/README.md`, which is the brand law).

## Global Constraints

- Node 20 only. The system Node is v14. Prefix every shell command that runs node/npm/npx with `source ~/.nvm/nvm.sh && nvm use 20 >/dev/null &&`. `site/.nvmrc` contains `20`.
- Repo root is `/home/talha/Talha/Business/Haturi/site/` (its own git repo). Raw folders (`Medal/`, `Shelf/`, `Cards/`, `Logo/`, `website-handoff/`) are read-only sources. Copy from them; never commit them.
- `website-handoff/inspo/*` is never copied into `site/`.
- Colours, fonts, radii, hairlines, scrims: only via CSS custom properties defined in `site/src/styles/tokens.css`. No colour literal (`#xxxxxx`, `rgb(`, `rgba(`) anywhere else in `src/`. Three.js reads colours from those tokens at runtime.
- Three type faces only: Archivo 800 (headings), Inter 400–600 (body), IBM Plex Mono 400–500 (labels, uppercase, letter-spacing 0.16–0.22em).
- Grounds: white `--color-bg`, cream `--color-cream`, warm near-black `--color-accent-2-900`. Max two grounds per view. Never `#000`, never a cold grey ground.
- Never: gradients, emoji, CSS `box-shadow`/`text-shadow`, centre-aligned body text, rounded artwork. Radius: 0 on artwork/cards, 6px (`--radius-button`) on buttons, 100px (`--radius-pill`) on callout pills.
- Voice: calm, honest, dry, short lines. No `!`. No cart, checkout, price, urgency language. No prices anywhere.
- Product names: **Medal Hanger** `HTR—MH` wordmark `Hanger.` · **Grid Shelf** `HTR—GS` wordmark `Grid.` (overrides "Cup Shelf" in the handoff).
- CTA is Instagram DM: `https://ig.me/m/<handle>`. Handle lives only in `src/config/site.ts`.
- Reduced motion (`prefers-reduced-motion: reduce`): no Lenis, no pinning/scrub, no 3D idle sway, drops appear in place. All content visible with JS disabled.
- Static output only (no adapter). Every file in `dist/` < 25 MiB (Cloudflare Pages limit).
- Mobile from 360px wide: no horizontal page scroll, side gutter ≥16px.
- Commit after every task. End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A new product folder with only required fields** (no gallery, reel, model, callouts) must build and render without empty sections or crashes. Pinned by the build-fixture test in Task 7.
2. **WebGL unavailable** (old phone, disabled GPU): the product photo shows in the viewer slot, no console errors. Pinned by `webgl-off.spec.ts` in Task 8.
3. **Vertical swipe over the 3D viewer on a phone** must scroll the page, not get trapped by the canvas. Pinned by the touch-swipe test in Task 8.
4. **ClientRouter navigation cycles** (home → product → back → other product): exactly one canvas per viewer, no stacked ScrollTriggers, header ink correct. Pinned by the nav-cycle test in Task 9.
5. **JS disabled / reduced motion**: every section's text and images visible. Pinned by `no-js.spec.ts` in Task 4 (extended in Tasks 5–7).

## File Structure

```
site/
  .nvmrc  .gitignore  package.json  astro.config.mjs  tsconfig.json
  vitest.config.ts  vitest.build.config.ts  playwright.config.ts
  README.md  PRODUCTS.md
  public/  _headers  favicon.png
  scripts/encode-media.mjs              — reel → web mp4 + poster + contact sheet
  src/
    config/site.ts                      — name, line, city, instagram handle, igDm()
    content.config.ts                   — products collection (thin wrapper)
    lib/product-schema.ts               — pure zod schema, PRODUCT_GLOB, MODEL_KINDS
    lib/catalog.ts                      — sortProducts, neighbours, mediaUrl (pure)
    lib/products.ts                     — getProducts, videoMap (astro-bound)
    lib/format.ts                       — dotDate, bracket, pad2
    lib/random.ts                       — mulberry32
    lib/pile.ts                         — pileOffsets (problem section math)
    content/products/_template/index.md
    content/products/medal-hanger/      — index.md, hero.jpg, g-*.jpg, reel.mp4, reel-poster.jpg
    content/products/grid-shelf/        — same shape
    assets/brand/  assets/home/  assets/problem/  assets/craft/
    styles/tokens.css  styles/global.css
    layouts/Base.astro
    components/  Header Footer Cursor Grain DmButton
                 Hero Problem ProductIndex ProductCard Craft HowToOrder
                 ProductHero ModelViewer Annotated SpecSheet Gallery Reel NextProduct
    scripts/motion/  lifecycle.ts smooth.ts reveal.ts header.ts tilt.ts cursor.ts
    scripts/three/   layout.ts tokens.ts wood.ts viewer.ts
                     models/index.ts models/medal-hanger.ts models/grid-shelf.ts models/types.ts
    pages/  index.astro  products/[slug].astro  404.astro
  tests/
    unit/   brand-rules site format product-schema catalog pile layout encode-media
    build/  minimal-product.test.ts  dist-budget.test.ts
    fixtures/minimal-product/index.md + hero.jpg
    e2e/    smoke chrome no-js home product viewer webgl-off nav-cycle
```

---

### Task 1: Scaffold, tokens, base layout, test harness

**Files:**
- Create: `site/.nvmrc`, `site/.gitignore`, `site/package.json`, `site/astro.config.mjs`, `site/tsconfig.json`, `site/vitest.config.ts`, `site/playwright.config.ts`
- Create: `site/src/styles/tokens.css`, `site/src/styles/global.css`, `site/src/layouts/Base.astro`, `site/src/pages/index.astro`
- Create: `site/src/assets/brand/mark-dark.png`, `site/src/assets/brand/mark-cream.png`, `site/public/favicon.png`
- Test: `site/tests/unit/brand-rules.test.ts`, `site/tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `Base.astro` props `{ title?: string; description?: string; image?: ImageMetadata }`, renders `<slot />` inside `<body>`. CSS tokens listed in Step 4. Classes `.mono .label .wrap .rule .h-hero .h-section .wordmark .lede .section .sr-only` and `[data-ground="white|cream|dark"]`.

- [ ] **Step 1: Create the project and install dependencies**

```bash
mkdir -p /home/talha/Talha/Business/Haturi/site && cd /home/talha/Talha/Business/Haturi/site
echo 20 > .nvmrc
git init -b main
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && npm init -y >/dev/null && \
npm i astro@^5 @astrojs/check@latest typescript@^5 @astrojs/sitemap@^3 \
  @fontsource/archivo @fontsource/inter @fontsource/ibm-plex-mono \
  gsap@^3.13 lenis@^1.3 three@^0.180 && \
npm i -D vitest@^3 @playwright/test@^1.55 @types/three@^0.180 ffmpeg-static@^5 tinyglobby@^0.2 && \
npx playwright install chromium
```

Then replace the `scripts` and add `"type": "module"` in `package.json`:

```json
{
  "name": "haturi-site",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview --port 4321",
    "test": "vitest run",
    "test:build": "vitest run --config vitest.build.config.ts",
    "test:e2e": "playwright test",
    "encode": "node scripts/encode-media.mjs"
  }
}
```
(keep the `dependencies`/`devDependencies` npm wrote).

`.gitignore`:
```
node_modules/
dist/
.astro/
.media-review/
test-results/
playwright-report/
```

- [ ] **Step 2: Config files**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://haturi.pages.dev',
  integrations: [sitemap()],
  vite: { build: { assetsInlineLimit: 0 } },
});
```

`tsconfig.json`:
```json
{ "extends": "astro/tsconfigs/strict", "include": [".astro/types.d.ts", "**/*"], "exclude": ["dist"] }
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' } });
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

- [ ] **Step 3: Write the failing brand-rules test**

`tests/unit/brand-rules.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { globSync } from 'tinyglobby';
import { describe, expect, it } from 'vitest';

const files = globSync(['src/**/*.{astro,css,ts}'], { ignore: ['src/styles/tokens.css'] });
const copy = globSync(['src/content/**/*.md', 'src/**/*.astro']);
const read = (f: string) => readFileSync(f, 'utf8');

describe('brand rules (website-handoff/README.md "Never")', () => {
  it('finds source files to check', () => expect(files.length).toBeGreaterThan(0));

  it.each(files)('%s has no colour literals outside tokens.css', (f) => {
    expect(read(f)).not.toMatch(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])|\brgba?\(/);
  });
  it.each(files)('%s has no gradients or CSS shadows', (f) => {
    const src = read(f);
    expect(src).not.toMatch(/gradient\(/);
    expect(src).not.toMatch(/(box|text)-shadow\s*:\s*(?!none)/);
  });
  it.each(copy)('%s has no emoji', (f) => {
    expect(read(f)).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it.each(globSync(['src/content/**/*.md']))('%s copy has no exclamation marks', (f) => {
    expect(read(f).replace(/^---[\s\S]*?---/, '')).not.toContain('!');
  });
});
```

Run: `source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && npx vitest run tests/unit/brand-rules.test.ts`
Expected: FAIL on "finds source files to check" (no `src/` yet).

- [ ] **Step 4: Tokens and global styles**

`src/styles/tokens.css` — copy `website-handoff/styles.css` verbatim **except** delete its two `@import url('https://fonts.googleapis.com/…')` lines and its trailing `body {…}` and `h1, h2, h3, h4 {…}` rules (fonts are self-hosted; base rules live in global.css). Then append:

```css
/* ---- Site extensions — values from website-handoff/README.md §2–4 ---- */
:root {
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --color-dark: var(--color-accent-2-900);
  --color-ink-head: var(--color-accent-2-900);
  --color-ink-label: var(--color-accent-2-700);
  --color-on-dark: var(--color-cream);
  --color-on-dark-mono: var(--color-accent-2-300);

  --hairline: rgba(58, 44, 31, 0.18);
  --hairline-dark: rgba(244, 237, 225, 0.26);
  --card-border: rgba(58, 44, 31, 0.14);
  --scrim: rgba(30, 22, 15, 0.36);

  --radius-button: 6px;
  --radius-pill: 100px;

  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
  --space-32: 128px;
  --gutter: clamp(16px, 4vw, 56px);
  --header-h: 64px;

  --text-mono: 12px;
  --text-mono-lg: 14px;
  --text-body: clamp(17px, 0.4vw + 15.5px, 19px);
  --text-section: clamp(34px, 3.2vw + 20px, 52px);
  --text-hero: clamp(56px, 6vw + 28px, 96px);
  --text-wordmark: clamp(72px, 15vw, 224px);
  --track-mono: 0.18em;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

`src/styles/global.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: 1.6;
  text-wrap: pretty;
  -webkit-font-smoothing: antialiased;
  overflow-x: clip;
}
img, video, canvas, picture { display: block; max-width: 100%; }
h1, h2, h3, h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-weight: var(--font-heading-weight);
  color: var(--color-ink-head);
  letter-spacing: -0.03em;
  line-height: 0.92;
}
p, figure, dl, dd, ol, ul { margin: 0; padding: 0; }
a { color: var(--color-ink-label); text-decoration: none; transition: color 0.2s var(--ease-out); }
a:hover { color: var(--color-ink-head); }
:focus-visible { outline: 1px solid var(--color-ink-label); outline-offset: 4px; }

.mono {
  font-family: var(--font-mono);
  font-size: var(--text-mono);
  font-weight: 500;
  letter-spacing: var(--track-mono);
  text-transform: uppercase;
  line-height: 1.5;
}
.label { color: var(--color-ink-label); }
.wrap { padding-inline: var(--gutter); max-width: 1440px; margin-inline: auto; }
.rule { border: 0; border-top: 1px solid var(--hairline); margin: 0; }
.h-hero { font-size: var(--text-hero); letter-spacing: -0.04em; line-height: 0.88; }
.h-section { font-size: var(--text-section); }
.wordmark {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: var(--text-wordmark);
  letter-spacing: -0.05em;
  line-height: 0.86;
  color: var(--color-ink-head);
}
.lede { max-width: 36ch; }
.section { padding-block: clamp(var(--space-16), 12vw, var(--space-32)); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

[data-ground="white"] { background: var(--color-bg); }
[data-ground="cream"] { background: var(--color-cream); }
[data-ground="dark"] { background: var(--color-dark); color: var(--color-on-dark); }
[data-ground="dark"] :is(h1, h2, h3, h4) { color: var(--color-on-dark); }
[data-ground="dark"] .mono, [data-ground="dark"] .label { color: var(--color-on-dark-mono); }
[data-ground="dark"] .rule { border-color: var(--hairline-dark); }
[data-ground="dark"] a { color: var(--color-on-dark-mono); }
[data-ground="dark"] a:hover { color: var(--color-on-dark); }

::view-transition-old(root), ::view-transition-new(root) { animation-duration: 0.45s; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 5: Brand assets, Base layout, placeholder home**

```bash
cd /home/talha/Talha/Business/Haturi
mkdir -p site/src/assets/brand site/public
cp website-handoff/brand/haturi-mark-dark.png site/src/assets/brand/mark-dark.png
cp website-handoff/brand/haturi-mark-cream.png site/src/assets/brand/mark-cream.png
cp website-handoff/brand/haturi-mark-dark.png site/public/favicon.png
```
Open both mark PNGs with the Read tool; confirm "dark" is the dark-ink mark (for light grounds) and "cream" the light-ink one. If reversed, swap the filenames.

`src/layouts/Base.astro`:
```astro
---
import '@fontsource/archivo/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '../styles/tokens.css';
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props { title?: string; description?: string; image?: ImageMetadata }
const name = 'Haturi Studio';
const {
  title,
  description = 'Minimal, handmade wooden display pieces for the things you earned. Made in Dhaka, one at a time.',
  image,
} = Astro.props;
const fullTitle = title ? `${title} — ${name}` : `${name} — Handmade in Dhaka`;
const canonical = new URL(Astro.url.pathname, Astro.site);
const og = image ? await getImage({ src: image, width: 1200, format: 'jpg' }) : null;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    {og && <meta property="og:image" content={new URL(og.src, Astro.site)} />}
    <meta name="twitter:card" content="summary_large_image" />
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```

`src/pages/index.astro` (temporary; replaced in Task 5):
```astro
---
import Base from '../layouts/Base.astro';
---
<Base>
  <main data-ground="cream" class="section wrap">
    <p class="mono label">[Haturi Studio] / Dhaka</p>
    <h1 class="h-hero">Haturi Studio</h1>
  </main>
</Base>
```

- [ ] **Step 6: Write the e2e smoke test**

`tests/e2e/smoke.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('home renders with brand title and self-hosted fonts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await expect(page).toHaveTitle(/Haturi Studio/);
  const family = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('Archivo');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('800 40px Archivo'))).toBe(true);
  expect(errors).toEqual([]);
});
```

- [ ] **Step 7: Run both tests**

Run: `cd site && source ~/.nvm/nvm.sh && nvm use 20 >/dev/null && npx vitest run && npx playwright test smoke`
Expected: all PASS (brand rules now find files; smoke passes on desktop and mobile).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro site with Haturi tokens, base layout and test harness

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Product content model and the two product folders

**Files:**
- Create: `site/src/config/site.ts`, `site/src/lib/format.ts`, `site/src/lib/product-schema.ts`, `site/src/lib/catalog.ts`, `site/src/lib/products.ts`, `site/src/content.config.ts`
- Create: `site/src/content/products/_template/index.md`, `site/src/content/products/medal-hanger/*`, `site/src/content/products/grid-shelf/*`, `site/PRODUCTS.md`
- Test: `site/tests/unit/site.test.ts`, `site/tests/unit/format.test.ts`, `site/tests/unit/product-schema.test.ts`, `site/tests/unit/catalog.test.ts`

**Interfaces:**
- Produces:
  - `site` object `{ name, line, city, instagram }`; `igDm(handle?: string): string`; `igProfile(handle?: string): string`
  - `dotDate(d: Date): string` → `"2026.OCT"`; `bracket(s: string): string` → `"[FOR RUNNERS]"`; `pad2(n: number): string`
  - `PRODUCT_GLOB = '[!_]*/index.md'`; `MODEL_KINDS = ['medal-hanger','grid-shelf'] as const`; `type ModelKind`; `productSchema(image)` returning a zod object with fields: `name, code, wordmark, order, audience, tagline, released, status, category?, hero, heroAlt, gallery[{src,alt}], specs[{label,value}], callouts[{label,x,y,side}], reel?{file,poster}, model?`
  - `sortProducts<T>(list)`, `neighbours<T>(list, id) → {prev,next} | null`, `mediaUrl(map, id, file?) → string | undefined`
  - `getProducts(): Promise<CollectionEntry<'products'>[]>` (sorted, excludes nothing yet); `videoMap: Record<string,string>`

- [ ] **Step 1: Confirm the Instagram handle**

Ask the owner for their Instagram handle (one question, no options needed). Use it as `HANDLE` below. Do not proceed with a guessed handle.

- [ ] **Step 2: Write the failing unit tests**

`tests/unit/site.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { igDm, igProfile, site } from '../../src/config/site';

describe('site config', () => {
  it('has a real instagram handle', () => expect(site.instagram).toMatch(/^[a-z0-9._]{1,30}$/));
  it('builds a DM link', () => expect(igDm('haturi')).toBe('https://ig.me/m/haturi'));
  it('builds a profile link', () => expect(igProfile('haturi')).toBe('https://www.instagram.com/haturi/'));
});
```

`tests/unit/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { bracket, dotDate, pad2 } from '../../src/lib/format';

describe('format', () => {
  it('dot-dates', () => expect(dotDate(new Date(2026, 9, 2))).toBe('2026.OCT'));
  it('brackets uppercase', () => expect(bracket('for runners')).toBe('[FOR RUNNERS]'));
  it('pads', () => { expect(pad2(3)).toBe('03'); expect(pad2(14)).toBe('14'); });
});
```

`tests/unit/product-schema.test.ts`:
```ts
import { z } from 'astro/zod';
import { globSync } from 'tinyglobby';
import { describe, expect, it } from 'vitest';
import { PRODUCT_GLOB, productSchema } from '../../src/lib/product-schema';

const schema = productSchema(() => z.string());
const minimal = {
  name: 'Medal Hanger', code: 'HTR—MH', wordmark: 'Hanger.', order: 1,
  audience: 'For runners', tagline: 'Fourteen medals. One wall.', released: '2026.AUG',
  hero: './hero.jpg', heroAlt: 'A hanger on a wall', specs: [{ label: 'Wood', value: 'Teak' }],
};

describe('productSchema', () => {
  it('accepts a minimal product and fills defaults', () => {
    const p = schema.parse(minimal);
    expect(p.gallery).toEqual([]);
    expect(p.callouts).toEqual([]);
    expect(p.status).toBe('available');
    expect(p.reel).toBeUndefined();
    expect(p.model).toBeUndefined();
  });
  it('rejects a code without the em dash pattern', () => {
    expect(() => schema.parse({ ...minimal, code: 'HTR-MH' })).toThrow();
  });
  it('requires the wordmark full stop', () => {
    expect(() => schema.parse({ ...minimal, wordmark: 'Hanger' })).toThrow();
  });
  it('requires a dot-date', () => {
    expect(() => schema.parse({ ...minimal, released: 'Aug 2026' })).toThrow();
  });
  it('requires at least one spec', () => {
    expect(() => schema.parse({ ...minimal, specs: [] })).toThrow();
  });
  it('bounds callout positions to 0–100', () => {
    expect(() => schema.parse({ ...minimal, callouts: [{ label: 'Teak', x: 120, y: 10 }] })).toThrow();
  });
  it('rejects unknown models', () => {
    expect(() => schema.parse({ ...minimal, model: 'chair' })).toThrow();
  });
  it('accepts a reel with mp4 file', () => {
    expect(schema.parse({ ...minimal, reel: { file: 'reel.mp4', poster: './reel-poster.jpg' } }).reel?.file).toBe('reel.mp4');
  });
  it('glob skips folders starting with underscore', () => {
    const found = globSync(PRODUCT_GLOB, { cwd: 'src/content/products' });
    expect(found).not.toContain('_template/index.md');
    expect(found).toEqual(expect.arrayContaining(['medal-hanger/index.md', 'grid-shelf/index.md']));
  });
});
```

`tests/unit/catalog.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { mediaUrl, neighbours, sortProducts } from '../../src/lib/catalog';

const p = (id: string, order: number, name = id) => ({ id, data: { order, name } });

describe('catalog', () => {
  it('sorts by order then name', () => {
    expect(sortProducts([p('b', 2), p('z', 1, 'Zed'), p('a', 1, 'Abe')]).map((x) => x.id)).toEqual(['a', 'z', 'b']);
  });
  it('does not mutate input', () => {
    const list = [p('b', 2), p('a', 1)];
    sortProducts(list);
    expect(list[0].id).toBe('b');
  });
  it('wraps neighbours', () => {
    const list = [p('a', 1), p('b', 2), p('c', 3)];
    expect(neighbours(list, 'a')).toEqual({ prev: list[2], next: list[1] });
    expect(neighbours(list, 'c')?.next.id).toBe('a');
    expect(neighbours(list, 'x')).toBeNull();
  });
  it('a single product is its own neighbour', () => {
    const list = [p('a', 1)];
    expect(neighbours(list, 'a')?.next.id).toBe('a');
  });
  it('resolves media by folder', () => {
    const map = { '/src/content/products/a/reel.mp4': '/_astro/reel.123.mp4' };
    expect(mediaUrl(map, 'a', 'reel.mp4')).toBe('/_astro/reel.123.mp4');
    expect(mediaUrl(map, 'a', undefined)).toBeUndefined();
    expect(() => mediaUrl(map, 'a', 'missing.mp4')).toThrow(/missing\.mp4/);
  });
});
```

Run: `npx vitest run tests/unit` — Expected: FAIL (modules not found).

- [ ] **Step 3: Implement config and pure libs**

`src/config/site.ts` (replace `HANDLE`):
```ts
export const site = {
  name: 'Haturi Studio',
  line: 'Handmade in Dhaka',
  city: 'Dhaka',
  instagram: 'HANDLE',
} as const;

export const igDm = (handle: string = site.instagram) => `https://ig.me/m/${handle}`;
export const igProfile = (handle: string = site.instagram) => `https://www.instagram.com/${handle}/`;
```

`src/lib/format.ts`:
```ts
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const dotDate = (d: Date) => `${d.getFullYear()}.${MONTHS[d.getMonth()]}`;
export const bracket = (s: string) => `[${s.toUpperCase()}]`;
export const pad2 = (n: number) => String(n).padStart(2, '0');
```

`src/lib/product-schema.ts`:
```ts
import { z } from 'astro/zod';

export const PRODUCT_GLOB = '[!_]*/index.md';
export const MODEL_KINDS = ['medal-hanger', 'grid-shelf'] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];

const DOT_DATE = /^\d{4}\.(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/;

export function productSchema<I extends z.ZodTypeAny>(image: () => I) {
  return z.object({
    name: z.string().min(1),
    code: z.string().regex(/^HTR—[A-Z]{2,3}$/, 'Use the form HTR—XX with an em dash'),
    wordmark: z.string().regex(/\.$/, 'Wordmarks end with a full stop'),
    order: z.number().int(),
    audience: z.string().min(1),
    tagline: z.string().min(1),
    released: z.string().regex(DOT_DATE, 'Use a dot-date like 2026.AUG'),
    status: z.enum(['available', 'soon']).default('available'),
    category: z.string().optional(),
    hero: image(),
    heroAlt: z.string().min(1),
    gallery: z.array(z.object({ src: image(), alt: z.string().min(1) })).default([]),
    specs: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).min(1),
    callouts: z
      .array(z.object({
        label: z.string().min(1),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        side: z.enum(['up', 'down']).default('up'),
      }))
      .default([]),
    reel: z.object({ file: z.string().regex(/\.(mp4|webm)$/), poster: image() }).optional(),
    model: z.enum(MODEL_KINDS).optional(),
  });
}
```

`src/lib/catalog.ts`:
```ts
interface Sortable { id: string; data: { order: number; name: string } }

export function sortProducts<T extends Sortable>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

export function neighbours<T extends { id: string }>(list: readonly T[], id: string): { prev: T; next: T } | null {
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const n = list.length;
  return { prev: list[(i - 1 + n) % n], next: list[(i + 1) % n] };
}

export function mediaUrl(map: Record<string, string>, id: string, file?: string): string | undefined {
  if (!file) return undefined;
  const key = `/src/content/products/${id}/${file}`;
  const url = map[key];
  if (!url) throw new Error(`Product "${id}" lists ${file}, but ${key} does not exist`);
  return url;
}
```

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { PRODUCT_GLOB, productSchema } from './lib/product-schema';

const products = defineCollection({
  loader: glob({
    pattern: PRODUCT_GLOB,
    base: './src/content/products',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) => productSchema(image),
});

export const collections = { products };
```

`src/lib/products.ts`:
```ts
import { getCollection } from 'astro:content';
import { sortProducts } from './catalog';

export const videoMap = import.meta.glob<string>('/src/content/products/*/*.{mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export async function getProducts() {
  return sortProducts(await getCollection('products'));
}
```

- [ ] **Step 4: Create the product folders (photos now, reels in Task 3)**

```bash
cd /home/talha/Talha/Business/Haturi
P=website-handoff/photos/product
M=site/src/content/products/medal-hanger
G=site/src/content/products/grid-shelf
mkdir -p $M $G site/src/content/products/_template
cp $P/mh-blue-wall-loaded.jpg $M/hero.jpg
cp $P/mh-hatirjheel-wall.jpg  $M/g-hatirjheel.jpg
cp $P/mh-stack-dark.jpg       $M/g-stack-dark.jpg
cp $P/mh-corner-clean2.jpg    $M/g-corner.jpg
cp $P/HKU00170.jpg            $M/g-shoot-1.jpg
cp $P/HKU00184.jpg            $M/g-shoot-2.jpg
cp $P/HKU00192.JPG            $M/g-shoot-3.jpg
cp $P/cs-loaded-45.jpg        $G/hero.jpg
cp $P/cs-counter-dark.jpg     $G/g-counter-dark.jpg
cp $P/cs-counter-wide.jpg     $G/g-counter-wide.jpg
cp $P/cs-angle-v.jpg          $G/g-angle.jpg
cp $P/cs-detail-cappuccino.jpg $G/g-cappuccino.jpg
cp $P/cs-detail-floral.jpg    $G/g-floral.jpg
cp $P/cs-green-v.jpg          $G/g-green.jpg
```
Open every copied `g-*` file with the Read tool. Remove any that is a meme, has baked-in text, is studio-flash white, or shows a different product, and delete its line from the frontmatter below. Re-estimate the callout `x`/`y` percentages against `hero.jpg` for each product (they mark points on the photo).

`src/content/products/medal-hanger/index.md`:
```md
---
name: Medal Hanger
code: HTR—MH
wordmark: Hanger.
order: 1
audience: For runners
tagline: Fourteen medals. One wall. Nothing left in a drawer.
released: 2026.AUG
hero: ./hero.jpg
heroAlt: A teak Medal Hanger on a blue wall, loaded with race medals.
gallery:
  - { src: ./g-hatirjheel.jpg, alt: The hanger on a wall in Hatirjheel. }
  - { src: ./g-stack-dark.jpg, alt: Finished hangers stacked in low light. }
  - { src: ./g-corner.jpg, alt: The hanger in a quiet corner. }
  - { src: ./g-shoot-1.jpg, alt: Medals hanging from the teak rails. }
  - { src: ./g-shoot-2.jpg, alt: Detail of the rails and ribbons. }
  - { src: ./g-shoot-3.jpg, alt: The hanger in place. }
specs:
  - { label: Wood, value: Solid teak }
  - { label: Board, value: 14 × 6 in }
  - { label: Rails, value: Two, 12 in each }
  - { label: Holds, value: 14+ medals }
  - { label: Hangs on, value: Two brass hooks }
  - { label: Made, value: One at a time, Dhaka }
callouts:
  - { label: Brass hooks, x: 37, y: 11, side: up }
  - { label: Solid teak board, x: 70, y: 20, side: up }
  - { label: Two 12 in rails, x: 45, y: 25, side: down }
model: medal-hanger
---

Medals end up in drawers, on door handles, on the corner of a headboard. This gives them one place on the wall, in the order you ran them.
```

`src/content/products/grid-shelf/index.md`:
```md
---
name: Grid Shelf
code: HTR—GS
wordmark: Grid.
order: 2
audience: For collectors
tagline: Sixteen cups. Each one with its own place.
released: 2026.AUG
hero: ./hero.jpg
heroAlt: The Grid Shelf in dark wood, holding cups in warm light.
gallery:
  - { src: ./g-counter-dark.jpg, alt: The shelf on a coffee counter at night. }
  - { src: ./g-counter-wide.jpg, alt: The shelf on a counter, wide view. }
  - { src: ./g-angle.jpg, alt: The shelf from an angle. }
  - { src: ./g-cappuccino.jpg, alt: A cappuccino cup in its slot. }
  - { src: ./g-floral.jpg, alt: A floral mug in its slot. }
  - { src: ./g-green.jpg, alt: The shelf against a green wall. }
specs:
  - { label: Wood, value: Shill Karai }
  - { label: Size, value: 23 × 23 in }
  - { label: Grid, value: 4 × 4 }
  - { label: Holds, value: 16 cups }
  - { label: Made, value: One at a time, Dhaka }
callouts:
  - { label: Shill Karai frame, x: 72, y: 6, side: down }
  - { label: Cross-lap pegs, x: 13, y: 46, side: up }
  - { label: Sixteen slots, x: 42, y: 62, side: down }
model: grid-shelf
---

Cups get stacked, chipped, pushed to the back of a cupboard. This puts each one where you can see it, and reach it.
```

`src/content/products/_template/index.md` (skipped by the glob):
```md
---
# Copy this folder to src/content/products/<your-slug>/ and fill it in.
# Required: name, code, wordmark, order, audience, tagline, released, hero, heroAlt, specs.
name: New Piece
code: HTR—NP
wordmark: Piece.
order: 99
audience: For someone
tagline: One calm line.
released: 2026.DEC
hero: ./hero.jpg
heroAlt: Describe the photo.
specs:
  - { label: Wood, value: Teak }
# Optional:
# gallery: [{ src: ./g-1.jpg, alt: ... }]
# callouts: [{ label: Teak, x: 50, y: 20, side: up }]   # x/y are % of hero.jpg
# reel: { file: reel.mp4, poster: ./reel-poster.jpg }   # encode with npm run encode
# model: medal-hanger | grid-shelf                      # 3D model, if one exists
# category: Walls                                        # reserved for later
---

One or two short paragraphs. Calm, honest, dry. No exclamation marks.
```

`PRODUCTS.md`:
```md
# Adding a product

1. Copy `src/content/products/_template/` to `src/content/products/<slug>/` (lowercase, dashes). The slug becomes the URL `/products/<slug>`.
2. Put a 4:5 straight-on `hero.jpg` in the folder, plus any gallery photos.
3. Fill in `index.md`. `npm run build` tells you exactly which field is wrong.
4. Optional reel: `npm run encode -- "<path to source video>" src/content/products/<slug>` creates `reel.mp4` and `reel-poster.jpg`, then add `reel: { file: reel.mp4, poster: ./reel-poster.jpg }`.
5. Optional 3D: only `medal-hanger` and `grid-shelf` models exist. New models go in `src/scripts/three/models/` and must be added to `MODEL_KINDS` in `src/lib/product-schema.ts`.
6. `npm run dev`, check the home page row and the product page, then commit and push. Cloudflare Pages rebuilds automatically.

Folders starting with `_` are ignored.
```

- [ ] **Step 5: Run tests and an Astro sync**

Run: `npx vitest run tests/unit && npx astro sync && npx astro check`
Expected: PASS; `astro sync` reports no content errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: folder-per-product content collection with Medal Hanger and Grid Shelf

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Video encoding pipeline and reels

**Files:**
- Create: `site/scripts/encode-media.mjs`, `site/src/assets/craft/` (pencil reel + poster)
- Modify: `site/src/content/products/medal-hanger/index.md`, `site/src/content/products/grid-shelf/index.md` (add `reel`)
- Test: `site/tests/unit/encode-media.test.ts`

**Interfaces:**
- Produces: CLI `npm run encode -- <input> <outDir> [name=reel]` → `<outDir>/<name>.mp4` (H.264, ≤720px wide, faststart, AAC 96k), `<outDir>/<name>-poster.jpg`, and `.media-review/<name>-contact.jpg` (12-frame contact sheet).

- [ ] **Step 1: Write the failing test**

`tests/unit/encode-media.test.ts`:
```ts
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpeg from 'ffmpeg-static';
import { expect, it } from 'vitest';

it('encodes a vertical clip into a small web mp4 with poster', () => {
  const dir = mkdtempSync(join(tmpdir(), 'haturi-enc-'));
  const src = join(dir, 'src.mp4');
  execFileSync(ffmpeg as string, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=duration=3:size=1080x1920:rate=30', '-c:v', 'libx264', '-crf', '10', src]);
  execFileSync('node', ['scripts/encode-media.mjs', src, dir, 'clip']);
  expect(existsSync(join(dir, 'clip.mp4'))).toBe(true);
  expect(existsSync(join(dir, 'clip-poster.jpg'))).toBe(true);
  expect(statSync(join(dir, 'clip.mp4')).size).toBeLessThan(statSync(src).size);
}, 60_000);
```

Run: `npx vitest run tests/unit/encode-media.test.ts` — Expected: FAIL (script missing).

- [ ] **Step 2: Implement the script**

`scripts/encode-media.mjs`:
```js
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const [, , input, outDir, name = 'reel'] = process.argv;
if (!input || !outDir) {
  console.error('usage: npm run encode -- <input video> <output folder> [name]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
mkdirSync('.media-review', { recursive: true });
const run = (args) => execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

run(['-i', input, '-vf', "scale='min(720,iw)':-2", '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
  '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', join(outDir, `${name}.mp4`)]);
run(['-ss', '1', '-i', input, '-frames:v', '1', '-vf', "scale='min(1080,iw)':-2", '-q:v', '3', join(outDir, `${name}-poster.jpg`)]);
run(['-i', input, '-vf', 'fps=1/2,scale=240:-2,tile=6x2', '-frames:v', '1', join('.media-review', `${name}-contact.jpg`)]);
console.log(`wrote ${join(outDir, name)}.mp4 and poster`);
```

Run the test — Expected: PASS.

- [ ] **Step 3: Review the source reels before choosing**

```bash
cd /home/talha/Talha/Business/Haturi/site
for f in "../Medal/Reel/Medal Hanger Reel.mp4" "../Medal/Reel/Medal Hanger Reel 2.mp4" "../Medal/Reel/Medal Hanger Reel (1).mp4" "../Shelf/Reel/Cup Shelf Reel.mp4" "../Shelf/Reel/Cup Shelf Reel 2.mp4" "../Medal/Reel/Pencil Reel.mp4"; do
  n=$(basename "$f" .mp4 | tr ' ()' '-__'); npm run -s encode -- "$f" .media-review/out "$n"; done
```
Open every `.media-review/*-contact.jpg` with the Read tool. Pick one Medal Hanger reel and one shelf reel: product in use, warm light, no memes, no "Cup Shelf" text on screen (the product is now Grid Shelf; if every shelf reel shows "Cup Shelf" text, tell the owner and skip the shelf reel). If the chosen poster frame (1s) is weak, re-run the poster command with a better `-ss`.

- [ ] **Step 4: Encode the chosen reels into place**

```bash
npm run encode -- "../Medal/Reel/<chosen medal reel>.mp4" src/content/products/medal-hanger reel
npm run encode -- "../Shelf/Reel/<chosen shelf reel>.mp4" src/content/products/grid-shelf reel
npm run encode -- "../Medal/Reel/Pencil Reel.mp4" src/assets/craft pencil
ls -la src/content/products/*/reel.mp4 src/assets/craft/
```
Expected: each mp4 under 8 MB.

Add to each product's frontmatter (after `callouts`):
```yaml
reel: { file: reel.mp4, poster: ./reel-poster.jpg }
```

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run && npx astro sync`
Expected: PASS.
```bash
git add -A && git commit -m "feat: ffmpeg encode pipeline and web reels for both products

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Site chrome and the motion core

**Files:**
- Create: `site/src/scripts/motion/lifecycle.ts`, `smooth.ts`, `reveal.ts`, `header.ts`, `cursor.ts`
- Create: `site/src/components/Header.astro`, `Footer.astro`, `Cursor.astro`, `Grain.astro`, `DmButton.astro`
- Modify: `site/src/layouts/Base.astro` (mount Grain, Cursor, boot script), `site/src/pages/index.astro`
- Test: `site/tests/e2e/chrome.spec.ts`, `site/tests/e2e/no-js.spec.ts`

**Interfaces:**
- Consumes: `site`, `igDm` (Task 2).
- Produces:
  - `onPage(init: () => (() => void) | void): void` — run `init` on every page load (initial + ClientRouter), call its cleanup before the next swap.
  - `reducedMotion(): boolean`; `startSmooth(): void`; `getLenis(): Lenis | null`
  - Markup contracts: any element with `data-reveal` fades up on enter; `data-reveal="rule"` draws a hairline left→right. Sections carry `data-ground`. Elements with `data-cursor="LABEL"` show LABEL in the cursor ring.
  - `<DmButton label? variant?="solid|ghost" size?="sm|md" />`
  - `Base.astro` now renders `<Header />` before and `<Footer />` after the slot; pages pass only `<main>` content.

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/chrome.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.describe('site chrome', () => {
  test('header DM link goes to Instagram DM in a new tab', async ({ page }) => {
    await page.goto('/');
    const dm = page.locator('header a[data-dm]');
    await expect(dm).toHaveAttribute('href', /^https:\/\/ig\.me\/m\/[a-z0-9._]+$/);
    await expect(dm).toHaveAttribute('target', '_blank');
    await expect(dm).toHaveAttribute('rel', /noopener/);
  });

  test('footer shows wordmark and instagram handle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer .wordmark')).toHaveText('Haturi.');
    await expect(page.locator('footer a[href*="instagram.com"]')).toBeVisible();
  });

  test('no horizontal page scroll and no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test('reduced motion leaves revealed content fully visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    for (const el of await page.locator('[data-reveal]').all()) {
      await el.scrollIntoViewIfNeeded();
      expect(Number(await el.evaluate((n) => getComputedStyle(n).opacity))).toBe(1);
    }
  });
});
```

`tests/e2e/no-js.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('home content is visible without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer .wordmark')).toBeVisible();
  for (const el of await page.locator('[data-reveal]').all()) {
    expect(Number(await el.evaluate((n) => getComputedStyle(n).opacity))).toBe(1);
  }
});
```

Run: `npx playwright test chrome no-js` — Expected: FAIL (no header/footer).

- [ ] **Step 2: Motion modules**

`src/scripts/motion/lifecycle.ts`:
```ts
type Cleanup = () => void;
type Init = () => Cleanup | void;

const inits: Init[] = [];
let cleanups: Cleanup[] = [];
let loaded = false;
let started = false;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function runCleanups() {
  for (const c of cleanups.splice(0)) c();
}
function runInit(init: Init) {
  const c = init();
  if (c) cleanups.push(c);
}

/** Register page-scoped setup. Runs now if the page already loaded, and again after every navigation. */
export function onPage(init: Init) {
  inits.push(init);
  if (loaded) runInit(init);
}

export function startLifecycle(afterLoad?: () => void) {
  if (started) return;
  started = true;
  document.addEventListener('astro:page-load', () => {
    runCleanups();
    loaded = true;
    for (const i of inits) runInit(i);
    afterLoad?.();
  });
  document.addEventListener('astro:before-swap', runCleanups);
}
```

`src/scripts/motion/smooth.ts`:
```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);
let lenis: Lenis | null = null;

export function startSmooth() {
  if (lenis || reducedMotion()) return;
  lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const getLenis = () => lenis;

export function refreshScroll() {
  lenis?.resize();
  ScrollTrigger.refresh();
}
```

`src/scripts/motion/reveal.ts`:
```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage } from './lifecycle';

gsap.registerPlugin(ScrollTrigger);

onPage(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // hide only what is below the fold, so nothing visible ever flickers out
    gsap.utils.toArray<HTMLElement>('[data-reveal]:not([data-reveal="rule"])')
      .filter((el) => el.getBoundingClientRect().top > innerHeight)
      .forEach((el) => gsap.set(el, { autoAlpha: 0 }));
    ScrollTrigger.batch('[data-reveal]:not([data-reveal="rule"])', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }),
    });
    gsap.utils.toArray<HTMLElement>('[data-reveal="rule"]').forEach((el) =>
      gsap.fromTo(el, { scaleX: 0, transformOrigin: '0 50%' }, {
        scaleX: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }),
    );
  });
  return () => mm.revert();
});
```

Note: only elements below the fold are hidden, and only by JS under no-preference motion, so content is visible without JS and with reduced motion. `mm.revert()` restores them on navigation.

`src/scripts/motion/header.ts`:
```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage } from './lifecycle';

onPage(() => {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const triggers = [...document.querySelectorAll<HTMLElement>('[data-ground="dark"]')].map((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: 'top top+=32',
      end: 'bottom top+=32',
      onToggle: (self) => header.toggleAttribute('data-on-dark', self.isActive),
    }),
  );
  triggers.push(ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => header.toggleAttribute('data-hidden', self.direction === 1 && self.scroll() > 160),
  }));
  return () => {
    triggers.forEach((t) => t.kill());
    header.removeAttribute('data-on-dark');
    header.removeAttribute('data-hidden');
  };
});
```

`src/scripts/motion/cursor.ts`:
```ts
import { gsap } from 'gsap';

export function startCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector<HTMLElement>('[data-cursor-ring]');
  const label = el?.querySelector('span');
  if (!el || !label || el.dataset.bound) return;
  el.dataset.bound = 'true';
  document.documentElement.dataset.cursorOn = '';
  gsap.set(el, { xPercent: -50, yPercent: -50 });
  const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); el.dataset.visible = ''; });
  document.addEventListener('pointerleave', () => delete el.dataset.visible);
  document.addEventListener('pointerover', (e) => {
    const target = (e.target as Element).closest<HTMLElement>('[data-cursor]');
    label.textContent = target?.dataset.cursor ?? '';
    el.toggleAttribute('data-active', Boolean(target));
  });
  addEventListener('pointerdown', () => gsap.fromTo(el, { scale: 0.7 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' }));
}
```

- [ ] **Step 3: Components**

`src/components/DmButton.astro`:
```astro
---
import { igDm } from '../config/site';
interface Props { label?: string; variant?: 'solid' | 'ghost'; size?: 'sm' | 'md' }
const { label = 'DM to order', variant = 'solid', size = 'md' } = Astro.props;
---
<a class:list={['dm', `dm--${variant}`, `dm--${size}`, 'mono']} href={igDm()} target="_blank" rel="noopener noreferrer" data-dm data-cursor="INSTAGRAM">
  <span>{label}</span><span aria-hidden="true">→</span>
</a>
<style>
  .dm {
    display: inline-flex; align-items: center; gap: var(--space-3);
    border-radius: var(--radius-button); border: 1px solid var(--color-ink-head);
    transition: background 0.3s var(--ease-out), color 0.3s var(--ease-out), gap 0.3s var(--ease-out);
  }
  .dm--md { padding: var(--space-4) var(--space-6); font-size: var(--text-mono-lg); }
  .dm--sm { padding: var(--space-2) var(--space-4); }
  .dm--solid { background: var(--color-ink-head); color: var(--color-cream); }
  .dm--solid:hover { background: transparent; color: var(--color-ink-head); gap: var(--space-4); }
  .dm--ghost { color: var(--color-ink-head); }
  .dm--ghost:hover { background: var(--color-ink-head); color: var(--color-cream); gap: var(--space-4); }
  :global([data-ground="dark"]) .dm, :global([data-on-dark]) .dm { border-color: var(--color-cream); }
  :global([data-ground="dark"]) .dm--solid, :global([data-on-dark]) .dm--solid { background: var(--color-cream); color: var(--color-dark); }
  :global([data-ground="dark"]) .dm--solid:hover, :global([data-on-dark]) .dm--solid:hover { background: transparent; color: var(--color-cream); }
  :global([data-ground="dark"]) .dm--ghost, :global([data-on-dark]) .dm--ghost { color: var(--color-cream); }
</style>
```

`src/components/Header.astro`:
```astro
---
import { Image } from 'astro:assets';
import markDark from '../assets/brand/mark-dark.png';
import markCream from '../assets/brand/mark-cream.png';
import DmButton from './DmButton.astro';
---
<header class="header" data-header>
  <a href="/" class="brand" data-cursor="HOME" aria-label="Haturi Studio, home">
    <Image src={markDark} alt="" width={28} class="mark mark--dark" />
    <Image src={markCream} alt="" width={28} class="mark mark--cream" />
    <span class="mono">Haturi Studio</span>
  </a>
  <nav class="nav mono" aria-label="Sections">
    <a href="/#products">[Products]</a>
    <a href="/#craft">[Craft]</a>
    <a href="/#order">[Order]</a>
  </nav>
  <DmButton size="sm" variant="ghost" label="DM" />
</header>
<style>
  .header {
    position: fixed; inset: 0 0 auto 0; z-index: 50; height: var(--header-h);
    display: flex; align-items: center; justify-content: space-between; gap: var(--space-6);
    padding-inline: var(--gutter);
    color: var(--color-ink-head);
    transition: transform 0.5s var(--ease-out), color 0.3s;
  }
  .header[data-hidden] { transform: translateY(-100%); }
  .brand { display: flex; align-items: center; gap: var(--space-3); color: inherit; }
  .mark { height: 28px; width: auto; }
  .mark--cream, .header[data-on-dark] .mark--dark { display: none; }
  .header[data-on-dark] .mark--cream { display: block; }
  .header[data-on-dark] { color: var(--color-cream); }
  .header[data-on-dark] a { color: var(--color-cream); }
  .nav { display: flex; gap: var(--space-6); }
  .nav a { color: inherit; }
  @media (max-width: 640px) { .nav { display: none; } .brand .mono { display: none; } }
</style>
```

`src/components/Footer.astro`:
```astro
---
import { igProfile, site } from '../config/site';
const year = new Date().getFullYear();
---
<footer class="footer" data-ground="dark">
  <div class="wrap">
    <p class="wordmark" data-reveal>Haturi.</p>
    <hr class="rule" data-reveal="rule" />
    <div class="rails mono">
      <a href={igProfile()} target="_blank" rel="noopener noreferrer" data-cursor="INSTAGRAM">@{site.instagram}</a>
      <span>{site.line} / {site.city}</span>
      <span>© {year} {site.name}</span>
    </div>
  </div>
</footer>
<style>
  .footer { padding-block: var(--space-24) var(--space-8); }
  .wordmark { color: var(--color-cream); margin-bottom: var(--space-8); }
  .rails { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-4); padding-top: var(--space-6); }
</style>
```

`src/components/Grain.astro` (paper grain; no colours, pure luminance noise):
```astro
<svg class="grain" aria-hidden="true" width="100%" height="100%">
  <filter id="grain-filter"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
  <rect width="100%" height="100%" filter="url(#grain-filter)" />
</svg>
<style>
  .grain { position: fixed; inset: 0; z-index: 60; pointer-events: none; opacity: 0.07; mix-blend-mode: multiply; }
</style>
```

`src/components/Cursor.astro`:
```astro
<div class="cursor" data-cursor-ring aria-hidden="true" transition:persist><span class="mono"></span></div>
<style>
  .cursor {
    position: fixed; left: 0; top: 0; z-index: 70; pointer-events: none;
    width: 14px; height: 14px; border-radius: var(--radius-pill);
    border: 1px solid var(--color-ink-head); background: transparent;
    display: grid; place-items: center; opacity: 0;
    transition: width 0.35s var(--ease-out), height 0.35s var(--ease-out), background 0.35s, opacity 0.3s;
    mix-blend-mode: difference; border-color: var(--color-cream);
  }
  .cursor[data-visible] { opacity: 1; }
  .cursor span { opacity: 0; color: var(--color-dark); font-size: 10px; transition: opacity 0.2s; }
  .cursor[data-active] { width: 72px; height: 72px; background: var(--color-cream); }
  .cursor[data-active] span { opacity: 1; }
  :global(html[data-cursor-on]), :global(html[data-cursor-on] a), :global(html[data-cursor-on] button) { cursor: none; }
</style>
```

- [ ] **Step 4: Wire into Base and boot the motion core**

In `src/layouts/Base.astro`, add imports:
```astro
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import Grain from '../components/Grain.astro';
import Cursor from '../components/Cursor.astro';
```
Replace the body with:
```astro
  <body>
    <Header />
    <slot />
    <Footer />
    <Grain />
    <Cursor />
    <script>
      import { startLifecycle } from '../scripts/motion/lifecycle';
      import { refreshScroll, startSmooth } from '../scripts/motion/smooth';
      import { startCursor } from '../scripts/motion/cursor';
      import '../scripts/motion/reveal';
      import '../scripts/motion/header';
      startSmooth();
      startCursor();
      startLifecycle(() => requestAnimationFrame(refreshScroll));
    </script>
  </body>
```

Update `src/pages/index.astro` to put a `data-reveal` on the existing kicker and `data-ground="cream"` on main (already present) so the reveal tests have targets.

- [ ] **Step 5: Run tests**

Run: `npx vitest run && npx playwright test`
Expected: all PASS (desktop + mobile).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: header, footer, cursor, grain and page-lifecycle motion core

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Home — hero and the problem

**Files:**
- Create: `site/src/lib/random.ts`, `site/src/lib/pile.ts`, `site/src/components/Hero.astro`, `site/src/components/Problem.astro`
- Create: `site/src/assets/home/hero.jpg`, `site/src/assets/problem/*.jpg`
- Modify: `site/src/pages/index.astro`
- Test: `site/tests/unit/pile.test.ts`, `site/tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `onPage`, `reducedMotion` (Task 4); `DmButton`; `dotDate` (Task 2).
- Produces: `mulberry32(seed: number): () => number`; `pileOffsets(rects: Rect[], center: {x:number;y:number}, seed: number, jitter?: number, maxRotation?: number): Offset[]` where `Rect = {x,y,w,h}`, `Offset = {x,y,rotation}`.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/pile.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { pileOffsets } from '../../src/lib/pile';
import { mulberry32 } from '../../src/lib/random';

describe('mulberry32', () => {
  it('is deterministic and in [0,1)', () => {
    const a = mulberry32(7), b = mulberry32(7);
    for (let i = 0; i < 50; i++) { const v = a(); expect(v).toBe(b()); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('pileOffsets', () => {
  const rects = [{ x: 0, y: 0, w: 100, h: 100 }, { x: 300, y: 200, w: 100, h: 100 }];
  const center = { x: 200, y: 150 };
  it('moves every rect centre to within jitter of the pile centre', () => {
    pileOffsets(rects, center, 3, 40).forEach((o, i) => {
      const cx = rects[i].x + rects[i].w / 2 + o.x, cy = rects[i].y + rects[i].h / 2 + o.y;
      expect(Math.abs(cx - center.x)).toBeLessThanOrEqual(40);
      expect(Math.abs(cy - center.y)).toBeLessThanOrEqual(40);
    });
  });
  it('keeps rotations within the max', () => {
    pileOffsets(rects, center, 3, 40, 14).forEach((o) => expect(Math.abs(o.rotation)).toBeLessThanOrEqual(14));
  });
  it('is stable for a seed', () => expect(pileOffsets(rects, center, 9)).toEqual(pileOffsets(rects, center, 9)));
});
```

Run: `npx vitest run tests/unit/pile.test.ts` — Expected: FAIL.

- [ ] **Step 2: Implement**

`src/lib/random.ts`:
```ts
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`src/lib/pile.ts`:
```ts
import { mulberry32 } from './random';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Offset { x: number; y: number; rotation: number }

export function pileOffsets(rects: Rect[], center: { x: number; y: number }, seed: number, jitter = 40, maxRotation = 14): Offset[] {
  const rand = mulberry32(seed);
  const spread = () => rand() * 2 - 1;
  return rects.map((r) => ({
    x: center.x - (r.x + r.w / 2) + spread() * jitter,
    y: center.y - (r.y + r.h / 2) + spread() * jitter,
    rotation: spread() * maxRotation,
  }));
}
```
Run the test — Expected: PASS.

- [ ] **Step 3: Copy home and problem photos**

```bash
cd /home/talha/Talha/Business/Haturi
mkdir -p site/src/assets/home site/src/assets/problem
cp website-handoff/photos/product/mh-stack-dark.jpg site/src/assets/home/hero.jpg
cp website-handoff/photos/problem/*.jpg site/src/assets/problem/
```
Open each problem photo with the Read tool and confirm the caption mapping in Step 5 matches what it shows; fix captions that don't.

- [ ] **Step 4: Write the failing e2e test**

`tests/e2e/home.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.describe('home', () => {
  test('sections appear in the handoff order', async ({ page }) => {
    await page.goto('/');
    const ids = await page.locator('main > section').evaluateAll((s) => s.map((n) => n.id));
    expect(ids).toEqual(['top', 'problem', 'products', 'craft', 'order']);
  });

  test('hero has the brand name as h1 and a DM button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#top h1')).toHaveAccessibleName('Haturi Studio');
    await expect(page.locator('#top a[data-dm]')).toBeVisible();
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
});
```
(The ids `products`, `craft`, `order` arrive in Task 6; this test stays red on the order check until then. Run only the hero and pile cases now: `npx playwright test home -g "hero|pile"`.)

- [ ] **Step 5: Components**

`src/components/Hero.astro`:
```astro
---
import { Picture } from 'astro:assets';
import hero from '../assets/home/hero.jpg';
import mark from '../assets/brand/mark-cream.png';
import { Image } from 'astro:assets';
import DmButton from './DmButton.astro';
import { dotDate } from '../lib/format';
const lines = ['Haturi', 'Studio'];
---
<section id="top" class="hero" data-ground="dark" data-hero>
  <div class="hero__media" data-hero-media>
    <Picture src={hero} alt="Finished hangers stacked in low tungsten light." widths={[640, 1280, 1920]} sizes="100vw" formats={['avif', 'webp']} loading="eager" fetchpriority="high" />
  </div>
  <div class="hero__scrim" aria-hidden="true"></div>
  <div class="hero__block" data-hero-block>
    <Image src={mark} alt="" width={56} class="hero__mark" data-hero-mark />
    <h1 class="h-hero" aria-label="Haturi Studio">
      {lines.map((line) => (
        <span class="line" aria-hidden="true">{[...line].map((c) => <span class="char" data-hero-char>{c}</span>)}</span>
      ))}
    </h1>
    <hr class="rule hero__rule" data-hero-rule />
    <div class="hero__meta" data-hero-meta>
      <p class="mono">For the things you earned</p>
      <p class="mono">Handmade in Dhaka / {dotDate(new Date())}</p>
      <DmButton />
    </div>
  </div>
  <p class="hero__cue mono" aria-hidden="true"><span class="cue-rule"></span>Scroll ↓</p>
</section>

<style>
  .hero { position: relative; height: 100svh; min-height: 560px; overflow: clip; display: grid; place-items: center; }
  .hero__media, .hero__scrim { position: absolute; inset: 0; }
  .hero__media :global(img) { width: 100%; height: 100%; object-fit: cover; }
  .hero__scrim { background: var(--scrim); }
  .hero__block { position: relative; display: grid; justify-items: center; gap: var(--space-6); padding-inline: var(--gutter); }
  .hero__mark { height: 56px; width: auto; }
  h1 { display: grid; justify-items: center; color: var(--color-cream); text-transform: uppercase; }
  .line { display: block; overflow: hidden; padding-bottom: 0.04em; }
  .char { display: inline-block; }
  .hero__rule { width: 120px; }
  .hero__meta { display: grid; justify-items: center; gap: var(--space-3); }
  .hero__meta :global(.dm) { margin-top: var(--space-4); }
  .hero__cue { position: absolute; left: var(--gutter); bottom: var(--space-8); display: flex; align-items: center; gap: var(--space-3); }
  .cue-rule { width: 40px; border-top: 1px solid var(--hairline-dark); }
</style>

<script>
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { onPage } from '../scripts/motion/lifecycle';
  gsap.registerPlugin(ScrollTrigger);

  onPage(() => {
    const hero = document.querySelector<HTMLElement>('[data-hero]');
    if (!hero) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('[data-hero-mark]', { rotation: -40, transformOrigin: '75% 85%' }, { rotation: 8, duration: 0.35, ease: 'power3.in' })
        .to('[data-hero-mark]', { rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' })
        .from('[data-hero-rule]', { scaleX: 0, duration: 0.9 }, '<')
        .from('[data-hero-char]', { yPercent: 110, duration: 1, stagger: 0.03 }, '<0.05')
        .from('[data-hero-meta] > *', { autoAlpha: 0, y: 12, stagger: 0.08, duration: 0.8 }, '-=0.6');
      gsap.fromTo('[data-hero-media]', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('[data-hero-block]', { yPercent: -25, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: true } });
    }, hero);
    return () => mm.revert();
  });
</script>
```

`src/components/Problem.astro`:
```astro
---
import { Picture } from 'astro:assets';
import improvised from '../assets/problem/medal-hung-improvised.jpg';
import deskPile from '../assets/problem/medals-desk-pile.jpg';
import headboard from '../assets/problem/medals-headboard.jpg';
import macro from '../assets/problem/medals-pile-macro.jpg';
import shelfClose from '../assets/problem/medals-shelf-close.jpg';
import shelfWide from '../assets/problem/medals-shelf-wide.jpg';
const photos = [
  { src: headboard, caption: 'Headboard', alt: 'Medals hung on the corner of a headboard.' },
  { src: deskPile, caption: 'Desk pile', alt: 'Medals piled on a desk.' },
  { src: improvised, caption: 'Improvised', alt: 'A medal hung on whatever was nearby.' },
  { src: macro, caption: 'The pile', alt: 'A close tangle of medals and ribbons.' },
  { src: shelfClose, caption: 'Shelf edge', alt: 'Medals draped over a shelf edge.' },
  { src: shelfWide, caption: 'Somewhere', alt: 'Medals on a crowded shelf.' },
];
---
<section id="problem" class="problem" data-ground="cream" data-problem>
  <div class="wrap problem__inner">
    <div class="problem__copy">
      <p class="mono label" data-reveal>[Be honest]</p>
      <hr class="rule" data-reveal="rule" />
      <h2 class="h-section" data-reveal>Where do your medals live right now?</h2>
      <p class="lede" data-reveal>In a drawer. On a headboard. Your favourite one is facing the wall, behind two others.</p>
      <p class="mono label problem__resolve" data-problem-resolve>They deserve a wall.</p>
    </div>
    <ul class="problem__stage" data-pile role="list">
      {photos.map((p, i) => (
        <li class="problem__item" data-pile-item>
          <Picture src={p.src} alt={p.alt} widths={[320, 640]} sizes="(min-width: 900px) 18vw, 70vw" formats={['avif', 'webp']} />
          <span class="mono label">[{String(i + 1).padStart(2, '0')}] {p.caption}</span>
        </li>
      ))}
    </ul>
  </div>
</section>

<style>
  .problem { min-height: 100svh; display: grid; align-items: center; padding-block: calc(var(--header-h) + var(--space-12)) var(--space-16); }
  .problem__inner { display: grid; gap: var(--space-12); }
  .problem__copy { display: grid; gap: var(--space-6); align-content: start; max-width: 32rem; }
  .problem__stage { list-style: none; display: grid; grid-auto-flow: column; grid-auto-columns: 70vw; gap: var(--space-4); overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: var(--space-4); }
  .problem__item { display: grid; gap: var(--space-2); scroll-snap-align: start; }
  .problem__item :global(img) { aspect-ratio: 4 / 5; object-fit: cover; width: 100%; }
  @media (min-width: 900px) {
    .problem__inner { grid-template-columns: 5fr 7fr; align-items: center; }
    .problem__stage { grid-auto-flow: row; grid-template-columns: repeat(3, 1fr); grid-auto-columns: auto; overflow: visible; }
  }
</style>

<script>
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { onPage } from '../scripts/motion/lifecycle';
  import { pileOffsets } from '../lib/pile';
  gsap.registerPlugin(ScrollTrigger);

  onPage(() => {
    const section = document.querySelector<HTMLElement>('[data-problem]');
    const stage = section?.querySelector<HTMLElement>('[data-pile]');
    if (!section || !stage) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-pile-item]', stage);
      const box = stage.getBoundingClientRect();
      const rects = items.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
      });
      const offsets = pileOffsets(rects, { x: box.width / 2, y: box.height / 2 }, 7);
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: '+=120%', pin: true, scrub: 0.6 } });
      items.forEach((el, i) => tl.from(el, { ...offsets[i], ease: 'power2.inOut', duration: 1 }, i * 0.06));
      tl.from('[data-problem-resolve]', { autoAlpha: 0, y: 16, duration: 0.4 }, '>-0.2');
    }, section);
    return () => mm.revert();
  });
</script>
```

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import Problem from '../components/Problem.astro';
import hero from '../assets/home/hero.jpg';
---
<Base image={hero}>
  <main>
    <Hero />
    <Problem />
  </main>
</Base>
```

- [ ] **Step 6: Run tests, look at it, commit**

Run: `npx vitest run && npx playwright test home -g "hero|pile" && npx playwright test chrome no-js`
Expected: PASS.
Then `npm run dev`, open `http://localhost:4321` in Playwright (`page.screenshot` at 1440×900 and 390×844 for hero and mid-problem) and look at the screenshots with the Read tool: hero type is cream on warm dark, the hammer taps, the pile reads as a pile, nothing overflows.
```bash
git add -A && git commit -m "feat: home hero with hammer tap and problem pile-to-grid scroll

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Home — products index, craft, how to order

**Files:**
- Create: `site/src/scripts/motion/tilt.ts`, `site/src/components/ProductIndex.astro`, `ProductCard.astro`, `Craft.astro`, `HowToOrder.astro`
- Create: `site/src/assets/craft/drawing.png`
- Modify: `site/src/pages/index.astro`
- Test: extend `site/tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `getProducts()` (Task 2), `bracket`, `pad2`, `onPage`, `DmButton`, `src/assets/craft/pencil.mp4` + `pencil-poster.jpg` (Task 3).
- Produces: any element `[data-tilt]` tilts toward the pointer (max 6°), children `[data-tilt-layer]` float at `translateZ(40px)`. Product card image wrapper carries `transition:name={`product-${id}`}` — Task 7 must use the same name on the product page viewer.

- [ ] **Step 1: Write the failing e2e tests** (append inside the `describe` in `home.spec.ts`)

```ts
  test('one product row per product folder, linking to its page', async ({ page }) => {
    const { globSync } = await import('tinyglobby');
    const { PRODUCT_GLOB } = await import('../../src/lib/product-schema');
    const ids = globSync(PRODUCT_GLOB, { cwd: 'src/content/products' }).map((f) => f.split('/')[0]).sort();
    await page.goto('/');
    const hrefs = await page.locator('#products a[data-product]').evaluateAll((a) => a.map((n) => n.getAttribute('href')));
    expect(hrefs.map((h) => h!.replace('/products/', '')).sort()).toEqual(ids);
  });

  test('craft section has the drawing and the pencil reel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#craft h2')).toHaveText('Haturi means hammer.');
    await expect(page.locator('#craft video')).toHaveAttribute('muted', '');
  });

  test('how to order has three steps and a DM button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#order [data-step]')).toHaveCount(3);
    await expect(page.locator('#order a[data-dm]')).toBeVisible();
  });
```

Run: `npx playwright test home` — Expected: FAIL on the new cases and on section order.

- [ ] **Step 2: Tilt**

`src/scripts/motion/tilt.ts`:
```ts
import { gsap } from 'gsap';
import { onPage } from './lifecycle';

onPage(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
  const offs: Array<() => void> = [];
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    gsap.set(el, { transformPerspective: 1000, transformStyle: 'preserve-3d' });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 12);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
    };
    const leave = () => { rx(0); ry(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    offs.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); gsap.set(el, { clearProps: 'transform' }); });
  });
  return () => offs.forEach((o) => o());
});
```
Import it in Base's boot script: `import '../scripts/motion/tilt';`.

- [ ] **Step 3: Products index**

`src/components/ProductCard.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { bracket, pad2 } from '../lib/format';
interface Props { product: CollectionEntry<'products'>; index: number }
const { product, index } = Astro.props;
const { data, id } = product;
const flip = index % 2 === 1;
---
<a href={`/products/${id}`} class:list={['card', { 'card--flip': flip }]} data-product data-cursor="VIEW">
  <div class="card__rail mono label"><span>{pad2(index + 1)} / {data.code}</span><span>{bracket(data.audience)}</span><span>{data.released}</span></div>
  <p class="wordmark card__word" data-reveal>{data.wordmark}</p>
  <div class="card__media" data-tilt>
    <div class="card__img" transition:name={`product-${id}`}>
      <Picture src={data.hero} alt={data.heroAlt} widths={[480, 960, 1440]} sizes="(min-width: 900px) 40vw, 92vw" formats={['avif', 'webp']} />
    </div>
    <span class="card__tag mono" data-tilt-layer>{data.status === 'soon' ? 'Coming soon' : 'View the piece →'}</span>
  </div>
  <div class="card__copy">
    <p class="lede">{data.tagline}</p>
    <ul class="card__specs mono label" role="list">{data.specs.slice(0, 3).map((s) => <li>{s.label} / {s.value}</li>)}</ul>
  </div>
  <hr class="rule card__rule" data-reveal="rule" />
</a>
<style>
  .card { display: grid; gap: var(--space-6); color: var(--color-text); padding-block: var(--space-12); }
  .card:hover { color: var(--color-text); }
  .card__rail { display: flex; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
  .card__word { transition: letter-spacing 0.6s var(--ease-out); }
  .card:hover .card__word { letter-spacing: -0.02em; }
  .card__media { position: relative; }
  .card__img :global(img) { aspect-ratio: 4 / 5; object-fit: cover; width: 100%; }
  .card__tag { position: absolute; left: var(--space-4); bottom: var(--space-4); padding: var(--space-2) var(--space-3); background: var(--color-cream); color: var(--color-ink-head); transform: translateZ(40px); }
  .card__copy { display: grid; gap: var(--space-4); }
  .card__specs { list-style: none; display: grid; gap: var(--space-1); }
  @media (min-width: 900px) {
    .card { grid-template-columns: 7fr 5fr; grid-template-areas: 'rail rail' 'word media' 'copy media' 'rule rule'; column-gap: var(--space-12); align-items: end; }
    .card--flip { grid-template-columns: 5fr 7fr; grid-template-areas: 'rail rail' 'media word' 'media copy' 'rule rule'; }
    .card__rail { grid-area: rail; } .card__word { grid-area: word; } .card__media { grid-area: media; } .card__copy { grid-area: copy; align-self: start; } .card__rule { grid-area: rule; }
  }
</style>
```

`src/components/ProductIndex.astro`:
```astro
---
import { getProducts } from '../lib/products';
import { pad2 } from '../lib/format';
import ProductCard from './ProductCard.astro';
const products = await getProducts();
---
<section id="products" class="section" data-ground="white">
  <div class="wrap">
    <div class="rail mono label"><span>[The pieces]</span><span>{pad2(products.length)} made / more to come</span></div>
    <hr class="rule" data-reveal="rule" />
    {products.map((product, index) => <ProductCard product={product} index={index} />)}
  </div>
</section>
<style>
  .rail { display: flex; justify-content: space-between; padding-bottom: var(--space-4); }
</style>
```

- [ ] **Step 4: Craft and how to order**

```bash
cp /home/talha/Talha/Business/Haturi/website-handoff/photos/product/mh-hanger-outline-v2.png /home/talha/Talha/Business/Haturi/site/src/assets/craft/drawing.png
```

`src/components/Craft.astro`:
```astro
---
import { Image } from 'astro:assets';
import drawing from '../assets/craft/drawing.png';
import poster from '../assets/craft/pencil-poster.jpg';
import pencil from '../assets/craft/pencil.mp4?url';
---
<section id="craft" class="section" data-ground="cream">
  <div class="wrap craft">
    <p class="mono label" data-reveal>[The craft] / Notes from the workshop</p>
    <hr class="rule" data-reveal="rule" />
    <h2 class="wordmark craft__title" data-reveal>Haturi means hammer.</h2>
    <hr class="rule" data-reveal="rule" />
    <div class="craft__media">
      <figure class="craft__drawing" data-draw-wrap>
        <Image src={drawing} alt="Pencil line drawing of the Medal Hanger: a board with two rails." widths={[640, 1280]} sizes="(min-width: 900px) 60vw, 92vw" data-draw />
        <figcaption class="mono label">HTR—MH / 14 × 6 in / Drawn before cut</figcaption>
      </figure>
      <video class="craft__video" src={pencil} poster={poster.src} muted loop playsinline preload="none" data-autoplay data-cursor="WATCH"></video>
    </div>
    <div class="craft__foot">
      <p class="mono label">One at a time / Dhaka</p>
      <p class="lede">Every piece is cut, joined and finished by hand. Solid teak for the hanger, Shill Karai for the shelf. No two boards share a grain.</p>
    </div>
  </div>
</section>
<style>
  .craft { display: grid; gap: var(--space-8); }
  .craft__title { font-size: clamp(56px, 9vw, 160px); }
  .craft__media { display: grid; gap: var(--space-6); align-items: end; }
  .craft__drawing { display: grid; gap: var(--space-3); }
  .craft__video { width: 100%; aspect-ratio: 9 / 16; object-fit: cover; max-height: 80svh; }
  .craft__foot { display: grid; gap: var(--space-4); }
  @media (min-width: 900px) {
    .craft__media { grid-template-columns: 8fr 3fr; }
    .craft__foot { grid-template-columns: 1fr 1fr; }
  }
</style>
<script>
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { onPage } from '../scripts/motion/lifecycle';
  gsap.registerPlugin(ScrollTrigger);

  onPage(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('[data-draw]', { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', ease: 'none',
        scrollTrigger: { trigger: '[data-draw-wrap]', start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    });
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.25 });
    document.querySelectorAll('video[data-autoplay]').forEach((v) => io.observe(v));
    return () => { mm.revert(); io.disconnect(); };
  });
</script>
```

`src/components/HowToOrder.astro`:
```astro
---
import DmButton from './DmButton.astro';
const steps = [
  { n: '01', title: 'Send a DM.', body: 'Tell us which piece, and what you will put on it.' },
  { n: '02', title: 'We confirm.', body: 'Size, wood and a date. Each piece is made to order.' },
  { n: '03', title: 'It arrives.', body: 'Finished by hand in Dhaka, then sent your way.' },
];
---
<section id="order" class="section" data-ground="dark">
  <div class="wrap order">
    <p class="mono" data-reveal>[How to order] / Three steps</p>
    <hr class="rule" data-reveal="rule" />
    <h2 class="h-section" data-reveal>No cart. Just a message.</h2>
    <ol class="steps" data-steps role="list">
      {steps.map((s) => (
        <li class="step" data-step>
          <span class="mono">{s.n}</span>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </li>
      ))}
    </ol>
    <div class="order__cta"><DmButton /><span class="mono">Handmade in Dhaka / Made to order</span></div>
  </div>
</section>
<style>
  .order { display: grid; gap: var(--space-8); }
  .steps { list-style: none; display: grid; gap: var(--space-4); perspective: 1200px; }
  .step { display: grid; gap: var(--space-4); padding: 28px; border: 1px solid var(--hairline-dark); }
  .step h3 { font-size: 28px; }
  .order__cta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-6); }
  @media (min-width: 900px) { .steps { grid-template-columns: repeat(3, 1fr); } }
</style>
<script>
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { onPage } from '../scripts/motion/lifecycle';
  gsap.registerPlugin(ScrollTrigger);

  onPage(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-step]', {
        rotationX: -75, transformOrigin: '50% 100%', autoAlpha: 0, y: 40,
        duration: 1.1, ease: 'expo.out', stagger: 0.14,
        scrollTrigger: { trigger: '[data-steps]', start: 'top 82%', once: true },
      });
    });
    return () => mm.revert();
  });
</script>
```
Note: "No cart. Just a message." names the absence of a cart; if the owner reads it as cart language, swap it for "One message. That is all."

`src/pages/index.astro` main becomes:
```astro
  <main>
    <Hero />
    <Problem />
    <ProductIndex />
    <Craft />
    <HowToOrder />
  </main>
```
(with the three imports added). Add the `data-ground` dark check to `no-js.spec.ts`: also assert `page.locator('#order [data-step]')` has count 3 and `#craft img` is visible.

- [ ] **Step 5: Run tests, screenshot, commit**

Run: `npx vitest run && npx playwright test`
Expected: all PASS. Screenshot products/craft/order at desktop and mobile; view them; fix overflow or contrast.
```bash
git add -A && git commit -m "feat: product index with tilt, craft spread and how-to-order steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Product page (photo fallback in the viewer slot)

**Files:**
- Create: `site/src/pages/products/[slug].astro`, `site/src/components/ProductHero.astro`, `ModelViewer.astro`, `Annotated.astro`, `SpecSheet.astro`, `Gallery.astro`, `Reel.astro`, `NextProduct.astro`, `site/src/pages/404.astro`
- Create: `site/vitest.build.config.ts`, `site/tests/fixtures/minimal-product/index.md`, `site/tests/fixtures/minimal-product/hero.jpg`
- Test: `site/tests/e2e/product.spec.ts`, `site/tests/build/minimal-product.test.ts`

**Interfaces:**
- Consumes: `getProducts`, `videoMap`, `neighbours`, `mediaUrl`, `bracket`, `pad2`, `DmButton`, `onPage`. Card `transition:name` = `product-${id}`.
- Produces: `<ModelViewer kind?: ModelKind; image: ImageMetadata; alt: string; id: string />` rendering
  `<figure class="viewer" data-viewer={kind} data-count="0" transition:name={`product-${id}`}>` with children `.viewer__fallback` (Picture), `.viewer__stage` (empty div; Task 8 mounts the canvas here), `[data-viewer-count]` span, `button[data-viewer-reset]`. When `kind` is undefined, no `data-viewer` attribute and no meta row.

- [ ] **Step 1: Write the failing tests**

`tests/e2e/product.spec.ts`:
```ts
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
```

`vitest.build.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/build/**/*.test.ts'], testTimeout: 300_000, fileParallelism: false } });
```

`tests/fixtures/minimal-product/index.md`:
```md
---
name: Test Piece
code: HTR—TP
wordmark: Test.
order: 99
audience: For testing
tagline: Only the required fields.
released: 2026.OCT
hero: ./hero.jpg
heroAlt: A test photo.
specs:
  - { label: Wood, value: Teak }
---

A minimal product used by the build test.
```
```bash
cp /home/talha/Talha/Business/Haturi/website-handoff/photos/product/mh-corner-clean2.jpg /home/talha/Talha/Business/Haturi/site/tests/fixtures/minimal-product/hero.jpg
```

`tests/build/minimal-product.test.ts`:
```ts
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { afterAll, expect, it } from 'vitest';

const dest = 'src/content/products/zz-minimal-test';
afterAll(() => { rmSync(dest, { recursive: true, force: true }); execSync('npx astro build', { stdio: 'ignore' }); });

it('a product folder with only required fields builds a clean page', () => {
  cpSync('tests/fixtures/minimal-product', dest, { recursive: true });
  execSync('npx astro build', { stdio: 'inherit' });
  const html = readFileSync('dist/products/zz-minimal-test/index.html', 'utf8');
  expect(html).toContain('Test.');
  expect(html).not.toContain('data-gallery-track');
  expect(html).not.toContain('<video');
  expect(html).not.toContain('data-callout');
  expect(html).not.toContain('data-viewer=');
  expect(existsSync('dist/index.html')).toBe(true);
  expect(readFileSync('dist/index.html', 'utf8')).toContain('/products/zz-minimal-test');
});
```

Run: `npx playwright test product` and `npm run test:build` — Expected: FAIL (no route).

- [ ] **Step 2: Route and section components**

`src/pages/products/[slug].astro`:
```astro
---
import { render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import ProductHero from '../../components/ProductHero.astro';
import Annotated from '../../components/Annotated.astro';
import SpecSheet from '../../components/SpecSheet.astro';
import Gallery from '../../components/Gallery.astro';
import Reel from '../../components/Reel.astro';
import NextProduct from '../../components/NextProduct.astro';
import { getProducts, videoMap } from '../../lib/products';
import { mediaUrl, neighbours } from '../../lib/catalog';

export async function getStaticPaths() {
  const products = await getProducts();
  return products.map((product) => ({ params: { slug: product.id }, props: { product, all: products } }));
}
const { product, all } = Astro.props;
const { data, id } = product;
const { Content } = await render(product);
const next = neighbours(all, id)!.next;
const reelSrc = data.reel ? mediaUrl(videoMap, id, data.reel.file) : undefined;
---
<Base title={data.name} description={data.tagline} image={data.hero}>
  <main>
    <ProductHero product={product} />
    {data.callouts.length > 0 && <Annotated image={data.hero} alt={data.heroAlt} callouts={data.callouts} code={data.code} />}
    <SpecSheet product={product}><Content /></SpecSheet>
    {data.gallery.length > 0 && <Gallery images={data.gallery} />}
    {reelSrc && data.reel && <Reel src={reelSrc} poster={data.reel.poster} code={data.code} />}
    {next.id !== id && <NextProduct product={next} />}
  </main>
</Base>
```

`src/components/ModelViewer.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { ModelKind } from '../lib/product-schema';
interface Props { kind?: ModelKind; image: ImageMetadata; alt: string; id: string }
const { kind, image, alt, id } = Astro.props;
const hint = kind === 'medal-hanger' ? 'Drag to turn / Tap to hang a medal' : 'Drag to turn / Tap to place a cup';
---
<figure class="viewer" data-viewer={kind} data-count="0" transition:name={`product-${id}`} data-cursor={kind ? 'DRAG' : undefined}>
  <Picture class="viewer__fallback" src={image} alt={alt} widths={[480, 960, 1440]} sizes="(min-width: 900px) 45vw, 92vw" formats={['avif', 'webp']} loading="eager" />
  <div class="viewer__stage"></div>
  {kind && (
    <figcaption class="viewer__meta mono label">
      <span>[{hint}]</span>
      <span class="viewer__right"><span data-viewer-count></span><button type="button" class="mono label" data-viewer-reset hidden>[Reset]</button></span>
    </figcaption>
  )}
</figure>
<style>
  .viewer { position: relative; display: grid; gap: var(--space-3); }
  .viewer__fallback, .viewer__stage { grid-area: 1 / 1; aspect-ratio: 4 / 5; width: 100%; }
  .viewer :global(.viewer__fallback img), .viewer :global(img.viewer__fallback) { width: 100%; height: 100%; object-fit: cover; }
  .viewer__stage { position: relative; opacity: 0; transition: opacity 0.8s var(--ease-out); }
  .viewer__stage :global(canvas) { width: 100% !important; height: 100% !important; touch-action: pan-y; }
  .viewer[data-ready] .viewer__stage { opacity: 1; }
  .viewer[data-ready] :global(.viewer__fallback) { opacity: 0; transition: opacity 0.8s var(--ease-out); }
  .viewer__meta { display: flex; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
  .viewer__right { display: flex; gap: var(--space-4); }
  button { background: none; border: 0; padding: 0; cursor: pointer; }
</style>
```
(`.viewer__fallback` sits on the `<picture>`; Astro passes `class` to the `<picture>` element. If the build puts it on `<img>` instead, the second selector covers it.)

`src/components/ProductHero.astro`:
```astro
---
import type { CollectionEntry } from 'astro:content';
import ModelViewer from './ModelViewer.astro';
import DmButton from './DmButton.astro';
import { bracket } from '../lib/format';
interface Props { product: CollectionEntry<'products'> }
const { data, id } = Astro.props.product;
---
<section class="phero" data-ground="cream">
  <div class="wrap phero__grid">
    <div class="phero__rail mono label"><span>{data.code}</span><span>{bracket(data.audience)}</span><span>{data.released}</span></div>
    <div class="phero__copy">
      <h1 class="wordmark">{data.wordmark}</h1>
      <p class="mono label">{data.name}</p>
      <p class="lede">{data.tagline}</p>
      <DmButton />
    </div>
    <ModelViewer kind={data.model} image={data.hero} alt={data.heroAlt} id={id} />
    <hr class="rule phero__rule" />
  </div>
</section>
<style>
  .phero { padding-block: calc(var(--header-h) + var(--space-8)) var(--space-12); }
  .phero__grid { display: grid; gap: var(--space-8); }
  .phero__rail { display: flex; justify-content: space-between; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--hairline); }
  .phero__copy { display: grid; gap: var(--space-6); align-content: end; justify-items: start; }
  @media (min-width: 900px) {
    .phero__grid { grid-template-columns: 6fr 5fr; grid-template-areas: 'rail rail' 'copy viewer' 'rule rule'; column-gap: var(--space-12); }
    .phero__rail { grid-area: rail; } .phero__copy { grid-area: copy; } .phero__grid > :global(.viewer) { grid-area: viewer; } .phero__rule { grid-area: rule; }
  }
</style>
```

`src/components/Annotated.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { pad2 } from '../lib/format';
interface Callout { label: string; x: number; y: number; side: 'up' | 'down' }
interface Props { image: ImageMetadata; alt: string; callouts: Callout[]; code: string }
const { image, alt, callouts, code } = Astro.props;
---
<section class="section" data-ground="white" data-annotated>
  <div class="wrap ann">
    <p class="mono label" data-reveal>[Materials] / {code}</p>
    <figure class="ann__figure">
      <Picture src={image} alt={alt} widths={[640, 1280, 1920]} sizes="(min-width: 900px) 70vw, 92vw" formats={['avif', 'webp']} />
      {callouts.map((c, i) => (
        <span class:list={['callout', `callout--${c.side}`]} style={`left:${c.x}%;top:${c.y}%`} data-callout>
          <span class="callout__dot mono">{pad2(i + 1)}</span>
          <span class="callout__line" data-callout-line></span>
          <span class="callout__pill mono" data-callout-pill>{c.label}</span>
        </span>
      ))}
    </figure>
    <ol class="ann__list mono label" role="list">{callouts.map((c, i) => <li>{pad2(i + 1)} / {c.label}</li>)}</ol>
  </div>
</section>
<style>
  .ann { display: grid; gap: var(--space-6); }
  .ann__figure { position: relative; max-width: 900px; margin-inline: auto; width: 100%; }
  .ann__figure :global(img) { width: 100%; }
  .callout { position: absolute; display: grid; justify-items: center; transform: translate(-50%, -50%); }
  .callout__dot { width: 22px; height: 22px; border-radius: var(--radius-pill); background: var(--color-cream); color: var(--color-ink-head); display: grid; place-items: center; font-size: 9px; letter-spacing: 0; }
  .callout__line, .callout__pill { display: none; }
  .ann__list { list-style: none; display: grid; gap: var(--space-2); }
  @media (min-width: 900px) {
    .callout { transform: translate(-50%, 0); }
    .callout--up { flex-direction: column-reverse; transform: translate(-50%, -100%); display: flex; align-items: center; }
    .callout--down { display: flex; flex-direction: column; align-items: center; }
    .callout__dot { width: 10px; height: 10px; font-size: 0; }
    .callout__line { display: block; width: 1px; height: 72px; background: var(--color-cream); transform-origin: 50% 0; }
    .callout--up .callout__line { transform-origin: 50% 100%; }
    .callout__pill { display: block; padding: var(--space-2) var(--space-4); border-radius: var(--radius-pill); border: 1px solid var(--card-border); background: var(--color-bg); color: var(--color-ink-head); white-space: nowrap; }
    .ann__list { display: none; }
  }
</style>
<script>
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { onPage } from '../scripts/motion/lifecycle';
  gsap.registerPlugin(ScrollTrigger);
  onPage(() => {
    const root = document.querySelector('[data-annotated]');
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 60%', once: true } })
        .from('[data-callout-line]', { scaleY: 0, duration: 0.8, ease: 'expo.out', stagger: 0.15 })
        .from('[data-callout-pill]', { autoAlpha: 0, y: 8, duration: 0.6, ease: 'expo.out', stagger: 0.15 }, '<0.3');
    }, root);
    return () => mm.revert();
  });
</script>
```

`src/components/SpecSheet.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
interface Props { product: CollectionEntry<'products'> }
const { data } = Astro.props.product;
const photo = data.gallery[0] ?? { src: data.hero, alt: data.heroAlt };
---
<section class="section" data-ground="cream">
  <div class="wrap sheet">
    <div class="sheet__photo" data-reveal>
      <Picture src={photo.src} alt={photo.alt} widths={[480, 960]} sizes="(min-width: 900px) 40vw, 92vw" formats={['avif', 'webp']} />
    </div>
    <div class="sheet__col">
      <p class="mono label">{data.code} / Spec sheet</p>
      <h2 class="h-section">{data.name}</h2>
      <div class="sheet__body"><slot /></div>
      <dl class="specs">
        {data.specs.map((s) => (<div class="specs__row" data-reveal><dt class="mono label">{s.label}</dt><dd>{s.value}</dd></div>))}
      </dl>
    </div>
  </div>
</section>
<style>
  .sheet { display: grid; gap: var(--space-12); }
  .sheet__photo :global(img) { aspect-ratio: 4 / 5; object-fit: cover; width: 100%; }
  .sheet__col { display: grid; gap: var(--space-6); align-content: start; border-left: 0; }
  .sheet__body :global(p) { max-width: 38ch; }
  .specs { display: grid; }
  .specs__row { display: grid; gap: var(--space-1); padding-block: var(--space-4); border-top: 1px solid var(--hairline); }
  .specs dd { color: var(--color-ink-head); }
  @media (min-width: 900px) {
    .sheet { grid-template-columns: 5fr 6fr; }
    .sheet__col { border-left: 1px solid var(--hairline); padding-left: var(--space-12); }
  }
</style>
```

`src/components/Gallery.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { pad2 } from '../lib/format';
interface Props { images: { src: ImageMetadata; alt: string }[] }
const { images } = Astro.props;
---
<section class="gallery" data-ground="dark" data-gallery>
  <div class="wrap gallery__head mono"><span>[In place]</span><span>{pad2(images.length)} photos</span></div>
  <div class="gallery__viewport">
    <div class="gallery__track" data-gallery-track>
      {images.map((img, i) => (
        <figure>
          <Picture src={img.src} alt={img.alt} widths={[480, 960, 1440]} sizes="(min-width: 900px) 40vw, 80vw" formats={['avif', 'webp']} />
          <figcaption class="mono">{pad2(i + 1)} / {pad2(images.length)}</figcaption>
        </figure>
      ))}
    </div>
  </div>
</section>
<style>
  .gallery { padding-block: var(--space-16); overflow: clip; }
  .gallery__head { display: flex; justify-content: space-between; padding-bottom: var(--space-6); }
  .gallery__viewport { overflow-x: auto; scroll-snap-type: x mandatory; padding-inline: var(--gutter); }
  .gallery[data-pinned] .gallery__viewport { overflow: visible; }
  .gallery__track { display: flex; gap: var(--space-6); width: max-content; }
  figure { display: grid; gap: var(--space-3); scroll-snap-align: start; }
  figure :global(img) { height: min(70svh, 720px); width: auto; aspect-ratio: 4 / 5; object-fit: cover; }
  @media (max-width: 899px) { figure :global(img) { height: auto; width: 80vw; } }
</style>
<script>
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import { onPage } from '../scripts/motion/lifecycle';
  gsap.registerPlugin(ScrollTrigger);
  onPage(() => {
    const section = document.querySelector<HTMLElement>('[data-gallery]');
    const track = section?.querySelector<HTMLElement>('[data-gallery-track]');
    if (!section || !track) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      section.dataset.pinned = '';
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 2 * parseFloat(getComputedStyle(section.querySelector('.gallery__viewport')!).paddingLeft));
      gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true } });
      return () => delete section.dataset.pinned;
    }, section);
    return () => mm.revert();
  });
</script>
```

`src/components/Reel.astro`:
```astro
---
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
interface Props { src: string; poster: ImageMetadata; code: string }
const { src, poster, code } = Astro.props;
const posterImg = await getImage({ src: poster, width: 720, format: 'webp' });
---
<section class="section reel" data-ground="cream">
  <div class="wrap reel__grid">
    <div class="reel__frame">
      <video src={src} poster={posterImg.src} muted loop playsinline preload="none" data-autoplay data-reel data-cursor="PLAY"></video>
      <div class="reel__overlay mono"><span class="reel__rule"></span>{code} / In motion</div>
      <button type="button" class="reel__sound mono" data-reel-sound aria-pressed="false">[Sound on]</button>
    </div>
    <div class="reel__copy">
      <p class="mono label" data-reveal>[Film]</p>
      <h2 class="wordmark reel__word" data-reveal>In motion.</h2>
    </div>
  </div>
</section>
<style>
  .reel__grid { display: grid; gap: var(--space-8); align-items: end; }
  .reel__frame { position: relative; max-width: 420px; }
  video { width: 100%; aspect-ratio: 9 / 16; object-fit: cover; }
  .reel__overlay { position: absolute; left: var(--space-4); bottom: var(--space-4); color: var(--color-cream); display: flex; align-items: center; gap: var(--space-3); }
  .reel__rule { width: 32px; border-top: 1px solid var(--hairline-dark); }
  .reel__sound { position: absolute; right: var(--space-4); top: var(--space-4); background: none; border: 0; color: var(--color-cream); cursor: pointer; }
  .reel__word { font-size: clamp(56px, 9vw, 160px); }
  @media (min-width: 900px) { .reel__grid { grid-template-columns: 4fr 7fr; } }
</style>
<script>
  import { onPage } from '../scripts/motion/lifecycle';
  onPage(() => {
    const video = document.querySelector<HTMLVideoElement>('[data-reel]');
    const btn = document.querySelector<HTMLButtonElement>('[data-reel-sound]');
    if (!video || !btn) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause()), { threshold: 0.3 });
    io.observe(video);
    const toggle = () => {
      video.muted = !video.muted;
      btn.textContent = video.muted ? '[Sound on]' : '[Sound off]';
      btn.setAttribute('aria-pressed', String(!video.muted));
    };
    btn.addEventListener('click', toggle);
    return () => { io.disconnect(); btn.removeEventListener('click', toggle); video.pause(); };
  });
</script>
```

`src/components/NextProduct.astro`:
```astro
---
import type { CollectionEntry } from 'astro:content';
interface Props { product: CollectionEntry<'products'> }
const { data, id } = Astro.props.product;
---
<section class="section" data-ground="white">
  <a class="wrap next" href={`/products/${id}`} data-next data-cursor="NEXT">
    <span class="mono label">[Next piece] / {data.code}</span>
    <span class="wordmark next__word">{data.wordmark}</span>
    <span class="mono label">{data.tagline} →</span>
  </a>
</section>
<style>
  .next { display: grid; gap: var(--space-6); }
  .next__word { transition: letter-spacing 0.7s var(--ease-out), color 0.3s; }
  .next:hover .next__word { letter-spacing: 0.01em; }
</style>
```

`src/pages/404.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Not found">
  <main data-ground="cream" class="nf">
    <div class="wrap nf__inner">
      <p class="mono label">[404] / Nothing hangs here</p>
      <hr class="rule" />
      <h1 class="wordmark">Wrong shelf.</h1>
      <a class="mono" href="/" data-cursor="HOME">Back to the workshop →</a>
    </div>
  </main>
</Base>
<style>
  .nf { min-height: 100svh; display: grid; align-items: center; }
  .nf__inner { display: grid; gap: var(--space-6); }
  .nf h1 { font-size: clamp(64px, 12vw, 200px); }
</style>
```
(`astro preview` serves `dist/404.html` with status 404 for unknown paths; Cloudflare Pages does the same.)

- [ ] **Step 3: Run tests, screenshot both product pages, commit**

Run: `npx vitest run && npm run test:build && npx playwright test`
Expected: all PASS. Screenshot each product page at 1440×900 and 390×844 (full page) and view them. Check callout pills sit on the right parts of the photo; adjust `x`/`y` in frontmatter if not.
```bash
git add -A && git commit -m "feat: product pages with annotated photo, spec sheet, pinned gallery and reel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 3D core — layout math, wood, viewer, Medal Hanger geometry

**Files:**
- Create: `site/src/scripts/three/layout.ts`, `tokens.ts`, `wood.ts`, `viewer.ts`, `models/types.ts`, `models/index.ts`, `models/medal-hanger.ts`
- Modify: `site/src/components/ModelViewer.astro` (mount script)
- Test: `site/tests/unit/layout.test.ts`, `site/tests/e2e/viewer.spec.ts`, `site/tests/e2e/webgl-off.spec.ts`

**Interfaces:**
- Consumes: `ModelKind` (Task 2), `mulberry32` (Task 5), `onPage`, `reducedMotion` (Task 4), ModelViewer markup contract (Task 7).
- Produces:
  - `railSlots(length: number, count: number, inset: number): number[]`
  - `gridSlots(o: { width: number; height: number; rows: number; cols: number; frame: number }): { x: number; y: number }[]` (row-major, top-left first)
  - `nextFree(occupied: ReadonlySet<number>, total: number, preferred?: number): number | null`
  - `nearestIndex(values: readonly number[], v: number, skip?: ReadonlySet<number>): number` (−1 if all skipped)
  - `swingAngle(t: number, amplitude: number, omega?: number, damping?: number): number`
  - `easeOutBounce(x: number): number`
  - `fitDistance(width: number, height: number, fovDeg: number, aspect: number, margin?: number): number`
  - `tokenColor(name: string): string` (reads CSS var, returns e.g. `"#5c4630"`)
  - `makeWood(THREE, { base, dark, light, seed }): THREE.CanvasTexture`
  - `ModelFactory`, `ModelHandle` (see `models/types.ts` below)
  - `mountViewer(el: HTMLElement): Promise<() => void>`

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/layout.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { easeOutBounce, fitDistance, gridSlots, nearestIndex, nextFree, railSlots, swingAngle } from '../../src/scripts/three/layout';

describe('railSlots', () => {
  it('spreads evenly inside the inset', () => {
    const s = railSlots(12, 7, 0.75);
    expect(s).toHaveLength(7);
    expect(s[0]).toBeCloseTo(-5.25);
    expect(s[6]).toBeCloseTo(5.25);
    expect(s[1] - s[0]).toBeCloseTo(s[6] - s[5]);
  });
  it('handles 0 and 1', () => { expect(railSlots(12, 0, 1)).toEqual([]); expect(railSlots(12, 1, 1)).toEqual([0]); });
});

describe('gridSlots', () => {
  const g = gridSlots({ width: 23, height: 23, rows: 4, cols: 4, frame: 0.75 });
  it('makes rows × cols centres, top-left first', () => {
    expect(g).toHaveLength(16);
    expect(g[0].x).toBeLessThan(0); expect(g[0].y).toBeGreaterThan(0);
    expect(g[15].x).toBeGreaterThan(0); expect(g[15].y).toBeLessThan(0);
  });
  it('is symmetric', () => { expect(g[0].x).toBeCloseTo(-g[3].x); expect(g[0].y).toBeCloseTo(-g[12].y); });
});

describe('nextFree / nearestIndex', () => {
  it('prefers the requested slot when free', () => expect(nextFree(new Set([1]), 4, 2)).toBe(2));
  it('falls back to the lowest free slot', () => expect(nextFree(new Set([0, 2]), 4, 2)).toBe(1));
  it('returns null when full', () => expect(nextFree(new Set([0, 1]), 2)).toBeNull());
  it('finds the nearest unskipped value', () => {
    expect(nearestIndex([-2, 0, 2], 1.4)).toBe(2);
    expect(nearestIndex([-2, 0, 2], 1.4, new Set([2]))).toBe(1);
    expect(nearestIndex([1], 0, new Set([0]))).toBe(-1);
  });
});

describe('motion curves', () => {
  it('swing starts at amplitude and settles', () => {
    expect(swingAngle(0, 0.4)).toBeCloseTo(0.4);
    expect(Math.abs(swingAngle(3, 0.4))).toBeLessThan(0.004);
  });
  it('bounce maps 0→0 and 1→1', () => { expect(easeOutBounce(0)).toBe(0); expect(easeOutBounce(1)).toBeCloseTo(1); });
});

describe('fitDistance', () => {
  it('backs off further for narrow viewports', () => {
    expect(fitDistance(14, 6, 30, 0.5)).toBeGreaterThan(fitDistance(14, 6, 30, 1.5));
  });
  it('fits height on wide viewports', () => {
    const d = fitDistance(10, 10, 30, 4, 1);
    expect(d).toBeCloseTo(5 / Math.tan((15 * Math.PI) / 180));
  });
});
```

Run: `npx vitest run tests/unit/layout.test.ts` — Expected: FAIL.

- [ ] **Step 2: Implement `layout.ts`**

```ts
export function railSlots(length: number, count: number, inset: number): number[] {
  if (count < 1) return [];
  if (count === 1) return [0];
  const usable = length - inset * 2;
  const step = usable / (count - 1);
  return Array.from({ length: count }, (_, i) => -usable / 2 + i * step);
}

export function gridSlots(o: { width: number; height: number; rows: number; cols: number; frame: number }) {
  const cw = (o.width - 2 * o.frame) / o.cols;
  const ch = (o.height - 2 * o.frame) / o.rows;
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < o.rows; r++)
    for (let c = 0; c < o.cols; c++)
      out.push({ x: -o.width / 2 + o.frame + cw * (c + 0.5), y: o.height / 2 - o.frame - ch * (r + 0.5) });
  return out;
}

export function nextFree(occupied: ReadonlySet<number>, total: number, preferred?: number): number | null {
  if (preferred !== undefined && preferred >= 0 && preferred < total && !occupied.has(preferred)) return preferred;
  for (let i = 0; i < total; i++) if (!occupied.has(i)) return i;
  return null;
}

export function nearestIndex(values: readonly number[], v: number, skip: ReadonlySet<number> = new Set()): number {
  let best = -1;
  let bestD = Infinity;
  values.forEach((x, i) => {
    if (skip.has(i)) return;
    const d = Math.abs(x - v);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export const swingAngle = (t: number, amplitude: number, omega = 6, damping = 2.2) =>
  amplitude * Math.exp(-damping * t) * Math.cos(omega * t);

export function easeOutBounce(x: number): number {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}

export function fitDistance(width: number, height: number, fovDeg: number, aspect: number, margin = 1.2): number {
  const half = Math.tan(((fovDeg / 2) * Math.PI) / 180);
  return Math.max(height / 2 / half, width / 2 / (half * aspect)) * margin;
}
```
Run the test — Expected: PASS.

- [ ] **Step 3: Tokens, wood, model types**

`src/scripts/three/tokens.ts`:
```ts
export function tokenColor(name: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!v) throw new Error(`Missing CSS token ${name}`);
  return v;
}
```

`src/scripts/three/wood.ts`:
```ts
import type * as T from 'three';
import { mulberry32 } from '../../lib/random';

export function makeWood(THREE: typeof T, o: { base: string; dark: string; light: string; seed: number }): T.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const rand = mulberry32(o.seed);
  g.fillStyle = o.base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 140; i++) {
    const y0 = rand() * size;
    const amp = 2 + rand() * 6;
    const freq = 0.004 + rand() * 0.01;
    g.strokeStyle = rand() > 0.5 ? o.dark : o.light;
    g.globalAlpha = 0.08 + rand() * 0.18;
    g.lineWidth = 0.6 + rand() * 2.2;
    g.beginPath();
    for (let x = 0; x <= size; x += 8) g.lineTo(x, y0 + Math.sin(x * freq + i) * amp);
    g.stroke();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
```

`src/scripts/three/models/types.ts`:
```ts
import type * as T from 'three';

export interface ModelContext {
  THREE: typeof T;
  reduced: boolean;
  /** Call after the count changes so the viewer updates its caption. */
  changed: () => void;
}

export interface ModelHandle {
  root: T.Object3D;
  /** Model size in scene units (inches), used to frame the camera. */
  size: { width: number; height: number };
  /** Called with the world-space point of a click on the model. */
  pick(point: T.Vector3): void;
  update(dt: number, elapsed: number): void;
  count(): { current: number; max: number; noun: string; fullLine: string };
  reset(): void;
  dispose(): void;
}

export type ModelFactory = (ctx: ModelContext) => ModelHandle;
```

`src/scripts/three/models/index.ts`:
```ts
import type { ModelKind } from '../../../lib/product-schema';
import type { ModelFactory } from './types';

export const models: Record<ModelKind, () => Promise<ModelFactory>> = {
  'medal-hanger': () => import('./medal-hanger').then((m) => m.createMedalHanger),
  'grid-shelf': () => import('./grid-shelf').then((m) => m.createGridShelf),
};
```
Until Task 9, create `models/grid-shelf.ts` exporting `createGridShelf` that throws `new Error('grid-shelf model arrives in Task 9')`; the viewer catches factory errors and stays on the photo fallback.

- [ ] **Step 4: Medal Hanger geometry (static; medals arrive in Task 9)**

`src/scripts/three/models/medal-hanger.ts`:
```ts
import type * as T from 'three';
import { tokenColor } from '../tokens';
import { makeWood } from '../wood';
import type { ModelFactory } from './types';

export const BOARD = { w: 14, h: 6, d: 0.75 };
export const RAIL = { len: 12, size: 0.75, standoff: 0.75, ys: [1.4, -1.4] };

export const createMedalHanger: ModelFactory = ({ THREE }) => {
  const root = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];
  const track = <X extends { dispose(): void }>(x: X) => (disposables.push(x), x);

  const tex = track(makeWood(THREE, {
    base: tokenColor('--color-accent-2-800'), dark: tokenColor('--color-accent-2-900'), light: tokenColor('--color-accent-2-600'), seed: 11,
  }));
  const wood = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0 }));
  const brass = track(new THREE.MeshStandardMaterial({ color: tokenColor('--color-accent-2-300'), metalness: 0.9, roughness: 0.3 }));

  const box = (w: number, h: number, d: number) => track(new THREE.BoxGeometry(w, h, d));
  const board = new THREE.Mesh(box(BOARD.w, BOARD.h, BOARD.d), wood);
  board.castShadow = board.receiveShadow = true;
  root.add(board);

  const zFront = BOARD.d / 2;
  for (const y of RAIL.ys) {
    const rail = new THREE.Mesh(box(RAIL.len, RAIL.size, RAIL.size), wood);
    rail.position.set(0, y, zFront + RAIL.standoff + RAIL.size / 2);
    rail.castShadow = true;
    rail.userData.rail = y;
    root.add(rail);
    for (const x of [-RAIL.len / 2 + RAIL.size / 2, RAIL.len / 2 - RAIL.size / 2]) {
      const block = new THREE.Mesh(box(RAIL.size, RAIL.size, RAIL.standoff), wood);
      block.position.set(x, y, zFront + RAIL.standoff / 2);
      block.castShadow = true;
      root.add(block);
    }
  }
  for (const x of [-4, 4]) {
    const hook = new THREE.Mesh(track(new THREE.TorusGeometry(0.32, 0.05, 8, 24, Math.PI * 1.5)), brass);
    hook.position.set(x, BOARD.h / 2 + 0.3, 0);
    hook.rotation.z = Math.PI * 0.25;
    root.add(hook);
  }

  return {
    root,
    size: { width: BOARD.w, height: BOARD.h + 1 },
    pick() {},
    update() {},
    count: () => ({ current: 0, max: 14, noun: 'Medals', fullLine: "That's a good year." }),
    reset() {},
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
};
```

- [ ] **Step 5: Viewer**

`src/scripts/three/viewer.ts`:
```ts
import type { ModelKind } from '../../lib/product-schema';
import { pad2 } from '../../lib/format';
import { reducedMotion } from '../motion/lifecycle';
import { fitDistance } from './layout';
import { models } from './models';
import { tokenColor } from './tokens';

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

export async function mountViewer(el: HTMLElement): Promise<() => void> {
  const kind = el.dataset.viewer as ModelKind | undefined;
  const stage = el.querySelector<HTMLElement>('.viewer__stage');
  if (!kind || !stage || !webglAvailable()) return () => {};

  const [THREE, { OrbitControls }, factory] = await Promise.all([
    import('three'),
    import('three/examples/jsm/controls/OrbitControls.js'),
    models[kind](),
  ]);
  const reduced = reducedMotion();
  const countEl = el.querySelector<HTMLElement>('[data-viewer-count]');
  const resetBtn = el.querySelector<HTMLButtonElement>('[data-viewer-reset]');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = 'pan-y';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
  scene.add(new THREE.HemisphereLight(tokenColor('--color-cream'), tokenColor('--color-accent-2-900'), 0.9));
  const key = new THREE.DirectionalLight(tokenColor('--color-accent-2-200'), 3);
  key.position.set(-14, 18, 22);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
  scene.add(key);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.22 }));
  wall.receiveShadow = true;

  let model: import('./models/types').ModelHandle;
  const updateCaption = () => {
    const c = model.count();
    if (countEl) countEl.textContent = c.current >= c.max ? `${pad2(c.current)} / ${pad2(c.max)} — ${c.fullLine}` : `${c.noun} ${pad2(c.current)} / ${pad2(c.max)}`;
    el.dataset.count = String(c.current);
    if (resetBtn) resetBtn.hidden = c.current === 0;
  };
  model = factory({ THREE, reduced, changed: updateCaption });
  scene.add(model.root);
  const box = new THREE.Box3().setFromObject(model.root);
  wall.position.z = box.min.z - 0.01;
  scene.add(wall);
  updateCaption();

  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.08,
    minAzimuthAngle: -Math.PI / 3, maxAzimuthAngle: Math.PI / 3,
    minPolarAngle: Math.PI / 2 - 0.35, maxPolarAngle: Math.PI / 2 + 0.25,
  });
  renderer.domElement.style.touchAction = 'pan-y';

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 0, fitDistance(model.size.width, model.size.height, camera.fov, camera.aspect));
    camera.updateProjectionMatrix();
    controls.update();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down: { x: number; y: number } | null = null;
  let lastInput = performance.now();
  const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; lastInput = performance.now(); };
  const onUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
    down = null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(model.root, true)[0];
    if (hit) model.pick(hit.point);
  };
  const onReset = () => { model.reset(); updateCaption(); };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  resetBtn?.addEventListener('click', onReset);

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(el);

  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reduced && performance.now() - lastInput > 3000) model.root.rotation.y = Math.sin(t * 0.4) * 0.22;
    model.update(dt, t);
    controls.update();
    renderer.render(scene, camera);
  };
  loop();
  el.dataset.ready = '';

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    controls.dispose();
    resetBtn?.removeEventListener('click', onReset);
    model.dispose();
    wall.geometry.dispose();
    (wall.material as import('three').Material).dispose();
    renderer.dispose();
    renderer.domElement.remove();
    delete el.dataset.ready;
  };
}
```

Mount script appended to `ModelViewer.astro`:
```astro
<script>
  import { onPage } from '../scripts/motion/lifecycle';
  onPage(() => {
    const cleanups: Array<() => void> = [];
    let disposed = false;
    document.querySelectorAll<HTMLElement>('[data-viewer]').forEach((el) => {
      const io = new IntersectionObserver(async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        try {
          const { mountViewer } = await import('../scripts/three/viewer');
          const dispose = await mountViewer(el);
          if (disposed) dispose(); else cleanups.push(dispose);
        } catch (err) {
          console.warn('3D viewer unavailable, showing photo', err);
        }
      }, { rootMargin: '200px' });
      io.observe(el);
      cleanups.push(() => io.disconnect());
    });
    return () => { disposed = true; cleanups.splice(0).forEach((c) => c()); };
  });
</script>
```

- [ ] **Step 6: Write and run the e2e tests**

`tests/e2e/viewer.spec.ts`:
```ts
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
  const x = box.x + box.width / 2, y = box.y + box.height * 0.7;
  await cdp.send('Input.synthesizeScrollGesture', { x, y, yDistance: -400, gestureSourceType: 'touch', speed: 800 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
});
```

`tests/e2e/webgl-off.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'] } });

test('without WebGL the product photo stays and nothing errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/products/medal-hanger');
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-viewer] canvas')).toHaveCount(0);
  await expect(page.locator('[data-viewer] img')).toBeVisible();
  expect(errors).toEqual([]);
});
```

Run: `npx vitest run && npx playwright test viewer webgl-off`
Expected: PASS. Screenshot the viewer at desktop; view it: warm light, readable wood, shadow on the "wall", board fully framed.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: lazy Three.js viewer with procedural teak Medal Hanger

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 3D play — hang medals, Grid Shelf with cups

**Files:**
- Modify: `site/src/scripts/three/models/medal-hanger.ts`
- Replace: `site/src/scripts/three/models/grid-shelf.ts`
- Test: extend `site/tests/e2e/viewer.spec.ts`; create `site/tests/e2e/nav-cycle.spec.ts`

**Interfaces:**
- Consumes: `railSlots`, `gridSlots`, `nearestIndex`, `nextFree`, `swingAngle`, `easeOutBounce` (Task 8), `ModelFactory` contract, `tokenColor`, `makeWood`.
- Produces: `createGridShelf: ModelFactory`; Medal Hanger `pick` hangs a medal. Both update `el.dataset.count` through `changed()`.

- [ ] **Step 1: Write the failing e2e tests** (append to `viewer.spec.ts`)

```ts
for (const [id, max] of [['medal-hanger', 14], ['grid-shelf', 16]] as const) {
  test(`${id}: taps add pieces up to ${max}, reset clears`, async ({ page }) => {
    await page.goto(`/products/${id}`);
    const viewer = page.locator(`[data-viewer="${id}"]`);
    await expect(viewer).toHaveAttribute('data-ready', '', { timeout: 15_000 });
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
```

`tests/e2e/nav-cycle.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('navigation cycles keep one canvas and clean scroll triggers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  for (let i = 0; i < 2; i++) {
    await page.locator('#products a[data-product]').first().click();
    await expect(page.locator('[data-viewer]')).toHaveAttribute('data-ready', '', { timeout: 15_000 });
    await page.locator('a[data-next]').click();
    await expect(page.locator('[data-viewer]')).toHaveAttribute('data-ready', '', { timeout: 15_000 });
    await expect(page.locator('canvas')).toHaveCount(1);
    await page.goBack();
    await page.goBack();
    await expect(page.locator('#products')).toBeAttached();
  }
  await expect(page.locator('header')).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  await expect(page.locator('header')).toHaveAttribute('data-on-dark', '');
  const pins = await page.locator('.pin-spacer').count();
  expect(pins).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
```
(At the top of home the header sits over the dark hero, hence `data-on-dark`. Home has exactly one pinned section on desktop (the problem pile) and none on mobile, so more than one `.pin-spacer` means ScrollTriggers leaked across navigations.)

Run: `npx playwright test viewer nav-cycle` — Expected: FAIL (count stays 0; shelf has no model).

- [ ] **Step 2: Medals on the hanger**

In `medal-hanger.ts`, add these imports and replace the returned object. Medal metals and ribbon colours come only from tokens.

```ts
import { easeOutBounce, nearestIndex, railSlots, swingAngle } from '../layout';

const PER_RAIL = 7;
const DROP = 0.55;
```

Inside `createMedalHanger`, after building the hooks:
```ts
  const slotsX = railSlots(RAIL.len, PER_RAIL, 0.9);
  const metals = ['--color-accent-2-400', '--color-neutral-300', '--color-accent-2-600'].map((n) =>
    track(new THREE.MeshStandardMaterial({ color: tokenColor(n), metalness: 0.85, roughness: 0.32 })));
  const ribbons = ['--color-accent-2-500', '--color-accent-700', '--color-neutral-700', '--color-accent-2-200', '--color-accent-2-700'].map((n) =>
    track(new THREE.MeshStandardMaterial({ color: tokenColor(n), roughness: 0.9, side: THREE.DoubleSide })));
  const discGeo = track(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 40));
  const ribbonGeo = track(new THREE.PlaneGeometry(0.9, 4.2));
  ribbonGeo.translate(0, -2.1, 0);

  type Medal = { group: T.Group; slot: number; born: number; railY: number };
  const medals: Medal[] = [];
  let clock = 0;
  const zRail = zFront + RAIL.standoff + RAIL.size + 0.05;

  function hang(slot: number) {
    const railIdx = slot < PER_RAIL ? 0 : 1;
    const railY = RAIL.ys[railIdx] + RAIL.size / 2;
    const group = new THREE.Group();
    const ribbon = new THREE.Mesh(ribbonGeo, ribbons[slot % ribbons.length]);
    const disc = new THREE.Mesh(discGeo, metals[slot % metals.length]);
    disc.rotation.x = Math.PI / 2;
    disc.position.y = -4.6;
    ribbon.castShadow = disc.castShadow = true;
    group.add(ribbon, disc);
    group.position.set(slotsX[slot % PER_RAIL] + (railIdx ? 0.35 : 0), railY, zRail + railIdx * 0.2);
    root.add(group);
    medals.push({ group, slot, born: clock, railY });
  }

  const taken = () => new Set(medals.map((m) => m.slot));
```

Return object:
```ts
  return {
    root,
    size: { width: BOARD.w, height: BOARD.h + 10 },
    pick(point) {
      const used = taken();
      if (used.size >= PER_RAIL * 2) { root.userData.shake = clock; return; }
      const local = root.worldToLocal(point.clone());
      const railPref = local.y >= 0 ? 0 : 1;
      const order = [railPref, 1 - railPref];
      for (const r of order) {
        const skip = new Set([...used].filter((s) => Math.floor(s / PER_RAIL) === r).map((s) => s % PER_RAIL));
        const i = nearestIndex(slotsX, local.x, skip);
        if (i >= 0) { hang(r * PER_RAIL + i); ctx.changed(); return; }
      }
    },
    update(dt, elapsed) {
      clock = elapsed;
      for (const m of medals) {
        const age = clock - m.born;
        if (ctx.reduced) { m.group.position.y = m.railY; m.group.rotation.x = 0; continue; }
        const k = Math.min(age / DROP, 1);
        m.group.position.y = m.railY + 6 * (1 - easeOutBounce(k));
        m.group.rotation.x = k < 1 ? 0 : swingAngle(age - DROP, 0.35);
      }
      const s = root.userData.shake as number | undefined;
      root.rotation.z = s !== undefined && clock - s < 0.6 ? Math.sin((clock - s) * 40) * 0.02 * (1 - (clock - s) / 0.6) : 0;
    },
    count: () => ({ current: medals.length, max: PER_RAIL * 2, noun: 'Medals', fullLine: "That's a good year." }),
    reset() { for (const m of medals.splice(0)) root.remove(m.group); },
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
```
Change the factory signature to `export const createMedalHanger: ModelFactory = (ctx) => { const { THREE } = ctx; … }` so `ctx.changed` and `ctx.reduced` are in scope. The camera framing uses `size.height = BOARD.h + 10` so hanging medals stay in frame; set `root.position.y = 3` so the board sits in the upper part of the view like the photo.

- [ ] **Step 3: Grid Shelf**

`src/scripts/three/models/grid-shelf.ts`:
```ts
import type * as T from 'three';
import { easeOutBounce, gridSlots, nextFree } from '../layout';
import { tokenColor } from '../tokens';
import { makeWood } from '../wood';
import type { ModelFactory } from './types';

const W = 23, H = 23, D = 4.5, F = 0.75, ROWS = 4, COLS = 4, SHELF = 0.6, DROP = 0.6;

export const createGridShelf: ModelFactory = (ctx) => {
  const { THREE } = ctx;
  const root = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];
  const track = <X extends { dispose(): void }>(x: X) => (disposables.push(x), x);

  const tex = track(makeWood(THREE, {
    base: tokenColor('--color-accent-2-900'), dark: tokenColor('--color-neutral-900'), light: tokenColor('--color-accent-2-800'), seed: 23,
  }));
  const wood = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.68 }));
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), wood);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  };

  box(W, H, 0.4, 0, 0, -D / 2 + 0.2);                 // back
  box(F, H, D, -W / 2 + F / 2, 0, 0);                  // left
  box(F, H, D, W / 2 - F / 2, 0, 0);                   // right
  box(W, F, D, 0, H / 2 - F / 2, 0);                   // top
  box(W, F, D, 0, -H / 2 + F / 2, 0);                  // bottom
  const rowH = (H - 2 * F) / ROWS, colW = (W - 2 * F) / COLS;
  const shelfYs = Array.from({ length: ROWS - 1 }, (_, i) => H / 2 - F - rowH * (i + 1));
  shelfYs.forEach((y) => box(W - 2 * F, SHELF, D, 0, y, 0));
  const pegXs = Array.from({ length: COLS - 1 }, (_, i) => -W / 2 + F + colW * (i + 1));
  const pegYs = [H / 2 - F, ...shelfYs, -H / 2 + F];
  for (const y of pegYs) for (const x of pegXs) box(0.6, 2.2, 0.6, x, y, D / 2 - 0.3);

  // cups: lathe body + torus handle, glazes from tokens
  const profile = [[0, 0], [1.25, 0], [1.4, 0.2], [1.45, 2.6], [1.38, 2.7]].map(([x, y]) => new THREE.Vector2(x, y));
  const bodyGeo = track(new THREE.LatheGeometry(profile, 36));
  const handleGeo = track(new THREE.TorusGeometry(0.62, 0.13, 10, 24, Math.PI * 1.1));
  const glazes = ['--color-cream', '--color-accent-2-100', '--color-neutral-200', '--color-accent-2-200', '--color-neutral-700'].map((n) =>
    track(new THREE.MeshStandardMaterial({ color: tokenColor(n), roughness: 0.35, side: THREE.DoubleSide })));

  const slots = gridSlots({ width: W, height: H, rows: ROWS, cols: COLS, frame: F });
  type Cup = { group: T.Group; slot: number; born: number; floor: number };
  const cups: Cup[] = [];
  let clock = 0;

  function place(slot: number) {
    const s = slots[slot];
    const floor = s.y - rowH / 2 + SHELF / 2;
    const group = new THREE.Group();
    const mat = glazes[slot % glazes.length];
    const body = new THREE.Mesh(bodyGeo, mat);
    const handle = new THREE.Mesh(handleGeo, mat);
    handle.position.set(1.45, 1.35, 0);
    handle.rotation.z = -Math.PI * 0.55;
    body.castShadow = handle.castShadow = true;
    group.add(body, handle);
    group.position.set(s.x, floor, 0.2);
    group.rotation.y = ((slot * 37) % 120) * (Math.PI / 180) - Math.PI / 3;
    root.add(group);
    cups.push({ group, slot, born: clock, floor });
  }

  return {
    root,
    size: { width: W, height: H },
    pick(point) {
      const local = root.worldToLocal(point.clone());
      let preferred = 0, best = Infinity;
      slots.forEach((s, i) => { const d = Math.hypot(s.x - local.x, s.y - local.y); if (d < best) { best = d; preferred = i; } });
      const slot = nextFree(new Set(cups.map((c) => c.slot)), slots.length, preferred);
      if (slot === null) { root.userData.shake = clock; return; }
      place(slot);
      ctx.changed();
    },
    update(_dt, elapsed) {
      clock = elapsed;
      for (const c of cups) {
        const k = ctx.reduced ? 1 : Math.min((clock - c.born) / DROP, 1);
        c.group.position.y = c.floor + 5 * (1 - easeOutBounce(k));
      }
      const s = root.userData.shake as number | undefined;
      root.rotation.z = s !== undefined && clock - s < 0.6 ? Math.sin((clock - s) * 40) * 0.015 * (1 - (clock - s) / 0.6) : 0;
    },
    count: () => ({ current: cups.length, max: slots.length, noun: 'Cups', fullLine: 'Full house.' }),
    reset() { for (const c of cups.splice(0)) root.remove(c.group); },
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
};
```

- [ ] **Step 4: Run, look, tune, commit**

Run: `npx vitest run && npx playwright test`
Expected: all PASS. Screenshot each viewer after 6 taps (desktop and mobile) and view them: medals hang from rails and swing; cups sit inside slots, not through shelves; full-state caption reads `14 / 14 — That's a good year.` / `16 / 16 — Full house.` (uppercased by `.mono`). Tune `root.position.y`, `size.height`, cup `floor` offset or `handle` position until it looks right.
```bash
git add -A && git commit -m "feat: hang medals and place cups in 3D, Grid Shelf model

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Budgets, headers, docs, deploy

**Files:**
- Create: `site/public/_headers`, `site/tests/build/dist-budget.test.ts`, `site/README.md`
- Modify: none else unless a budget fails

**Interfaces:**
- Consumes: the whole built `dist/`.
- Produces: a GitHub repo and a Cloudflare Pages project serving `dist/`.

- [ ] **Step 1: Write the failing budget test**

`tests/build/dist-budget.test.ts`:
```ts
import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { globSync } from 'tinyglobby';
import { beforeAll, expect, it } from 'vitest';

beforeAll(() => execSync('npx astro build', { stdio: 'ignore' }));

it('every file is under the Cloudflare Pages 25 MiB limit', () => {
  for (const f of globSync('dist/**/*')) expect(statSync(f).size, f).toBeLessThan(25 * 1024 * 1024);
});

it('home does not load Three.js up front', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  const scripts = [...html.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.js)"/g)].map((m) => m[1]);
  for (const s of scripts) expect(readFileSync(`dist${s}`, 'utf8'), s).not.toContain('WebGLRenderer');
});

it('home ships under 1.5 MB of html, css and js', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.(?:js|css))"/g)].map((m) => `dist${m[1]}`);
  const total = [ 'dist/index.html', ...new Set(assets) ].reduce((n, f) => n + statSync(f).size, 0);
  expect(total).toBeLessThan(1.5 * 1024 * 1024);
});

it('no inspo images were published', () => {
  expect(globSync('dist/**/*inspo*')).toEqual([]);
});

it('_headers is published', () => expect(statSync('dist/_headers').isFile()).toBe(true));
```

Run: `npm run test:build` — Expected: FAIL on `_headers`.

- [ ] **Step 2: `_headers` and README**

`public/_headers`:
```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`README.md`:
```md
# Haturi Studio — website

Static Astro site. Brand rules: `../website-handoff/README.md`.

## Run
    nvm use            # Node 20
    npm install
    npm run dev        # http://localhost:4321

## Test
    npm test           # unit + brand rules
    npm run test:build # build fixtures + size budgets
    npm run test:e2e   # Playwright, desktop + mobile

## Add a product
See PRODUCTS.md. One folder per product in src/content/products/.

## Deploy (Cloudflare Pages, free)
Pages project connected to this GitHub repo:
- Framework preset: Astro
- Build command: npm run build
- Output directory: dist
- Environment variable: NODE_VERSION = 20
Every push to main redeploys.
```

Run: `npm test && npm run test:build && npx playwright test`
Expected: all PASS.

- [ ] **Step 3: Final review pass**

Screenshot every page (home, both products, 404) at 1440×900 and 390×844, full page, and view each one against `website-handoff/README.md` §2–6 and "Never". Fix anything off-brand. Then run the `superpowers:requesting-code-review` skill on the whole branch.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: cache headers, dist budgets and deploy docs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Publish (ask the owner first — this is outward-facing)**

Ask the owner for: their GitHub username and repo name (default `haturi-site`), and whether the repo should be public or private. `gh` is not installed, so the owner creates the empty repo on github.com (no README), then:
```bash
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```
Then the owner connects it in Cloudflare: Workers & Pages → Create → Pages → Connect to Git → pick the repo → settings from README "Deploy". Once live, update `site` in `astro.config.mjs` to the real `*.pages.dev` (or custom) URL, commit and push.
```
