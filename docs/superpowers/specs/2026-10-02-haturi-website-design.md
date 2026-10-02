# Haturi Studio Website — Design

Date: 2026-10-02 · Source of truth for look: `website-handoff/README.md` + `website-handoff/styles.css`

## Goal

A minimal, highly interactive, Nordic-vintage site for Haturi Studio that showcases products (Medal Hanger, Grid Shelf; more later) and sends people to Instagram DM to order. Static, deployed free on Cloudflare Pages from the owner's GitHub.

## Decisions (confirmed with owner, 2026-10-02)

- Second product is named **Grid Shelf** — code `HTR—GS`, wordmark `Grid.` (overrides "Cup Shelf" in the handoff README). Medal Hanger stays `HTR—MH`, wordmark `Hanger.`
- Order CTA: **Instagram DM** (`https://ig.me/m/<handle>`). Handle to be supplied by owner.
- 3D: **real Three.js models**, procedurally built per product, drag to turn, tap to hang a medal / drop a cup.
- **No prices** anywhere.
- Adding a product = adding a folder `src/content/products/<slug>/` (index.md + photos + optional reel). Categories later: optional `category` field reserved, unused for now.

## Stack

Astro 5 (static output) · TypeScript · GSAP + ScrollTrigger · Lenis · Three.js (lazy-loaded) · Astro ClientRouter view transitions · self-hosted fonts via Fontsource (Archivo 800, Inter 400–600, IBM Plex Mono 400–500) · Vitest + Playwright · ffmpeg-static for video encoding.

## Pages

**Home** (`/`) — the six sections from handoff §8, in order:
1. Hero — dark still-life (`mh-stack-dark.jpg`), scrim, letter-drop "Haturi Studio", hammer-mark "tap" intro, one line "For the things you earned.", DM CTA. Image settles on scroll.
2. The problem — cream. "Where do your medals live right now?" Six problem photos start as a messy pile and straighten into a tidy grid as you scroll (pinned, desktop). Ends: "They deserve a wall."
3. Products — white, catalog-wordmark rows generated from the collection; cursor-driven 3D tilt; image morphs into the product page (shared-element view transition).
4. The craft — atelier spread. "Haturi means hammer." Pencil line drawing wipes in as if drawn; Pencil Reel plays in view.
5. How to order — dark. Three steps fold up in 3D on scroll. DM CTA.
6. Footer — dark, giant `Haturi.` wordmark, handle, Dhaka.

**Product** (`/products/<slug>`) — wordmark hero + 3D viewer (photo fallback) → annotated product (callout pills on leader lines) → spec sheet → horizontal pinned gallery → reel → next piece.

**404** — "Wrong shelf."

## Interaction inventory ("fun")

Hammer tap intro · pile→grid problem · tilt cards · card→product morph · hang medals / drop cups with counter (`MEDALS 03 / 14`, full: `14 / 14 — THAT'S A GOOD YEAR.`; `CUPS 16 / 16 — FULL HOUSE.`) · custom cursor ring with labels (VIEW / DRAG / PLAY) · wordmark letter-spread hover · header that hides on scroll-down and switches ink over dark sections · paper grain overlay.

## Non-goals

Cart, checkout, prices, CMS, analytics, categories UI, dark-mode theme switch, multi-language.
