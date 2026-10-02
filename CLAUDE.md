# Haturi Studio — Project Context

Read this before making changes. Brand law lives in `../website-handoff/README.md` (design language, colours, type, layout systems, the "Never" list).

## The business

Haturi Studio is a small Dhaka-based maker of minimal wooden display pieces, made one at a time. "Haturi" means hammer.

- **Medal Hanger** `HTR—MH` — for runners. Solid teak, 14 × 6 in board, two 12 in rails, holds 14+ medals.
- **Grid Shelf** `HTR—GS` — for collectors. Shill Karai, 23 × 23 in, 4 × 4 grid, 16 cups. (Older posts and reels call it "Cup Shelf"; the site uses Grid Shelf.)

Voice: calm, honest, dry. Short lines. No exclamation marks, no hype, no urgency.

## Current direction (decided 2026-10-02)

- **Static site**: Astro 5, TypeScript, GSAP + ScrollTrigger, Lenis, Three.js (lazy-loaded procedural 3D models), Astro view transitions. Fonts self-hosted via Fontsource.
- **Hosting**: Cloudflare Worker serving `dist/` as static assets (`wrangler.jsonc`), free tier. See `DEPLOY.md`.
- **Ordering**: Instagram DM only (`ig.me/m/haturistudio`). No cart, no checkout, **no prices on the site**.
- **Products**: one folder per product in `src/content/products/<slug>/`. See `PRODUCTS.md`.
- **Later, not now**: a Django backend for orders/payments (cart, bKash, Steadfast) may come as a separate app. Don't build toward it in this repo.

## Working rules

1. One task at a time; keep diffs small and scoped.
2. Stop and ask before adding a dependency or changing scope.
3. Tests first: `npm test` (unit + brand rules), `npm run test:build`, `npm run test:e2e` (Playwright, desktop + mobile).
4. Colours, fonts and radii only via tokens in `src/styles/tokens.css`. The brand-rules test enforces it.
5. Node 20 (`nvm use`). The system Node is too old.

## Plan

`docs/superpowers/plans/2026-10-02-haturi-website.md` (spec alongside in `docs/superpowers/specs/`).
