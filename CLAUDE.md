# Haturi Studio — Project Context

This file gives Claude Code the background for this project. Read it before making changes.

## The business

Haturi Studio is a small, Dhaka-based maker of minimal wooden display pieces. Two customer segments, one visual identity:

- **Runners (Medal Hanger)** — problem-solving buy, impulse-friendly, ~1,500–2,000 BDT, motivational/energetic tone
- **Collectors (Cup Shelf)** — identity/aesthetic buy, considered purchase, ~6,000–7,000 BDT, warm/calm/minimal tone

Voice: warm, honest, unpretentious — a small maker, not a big brand. Never generic e-commerce hype. Visuals: wood tones, minimal backgrounds, natural daylight, occasional human context (a hand hanging a medal). Product line starts with 2 products live, more marked "coming soon."

## Current status

Repo is cloned locally. Nothing scaffolded yet. This is the very first step.

## Tech stack (decided, don't relitigate without discussion)

- **Backend**: Django (Python) — chosen specifically because Django admin gives a real order/email/delivery dashboard almost for free, and the owner is Python-comfortable, not frontend-comfortable.
- **Frontend**: Django templates + Tailwind CSS for styling + HTMX + Alpine.js for interactivity/small animations. **No React, no Next.js, no separate frontend app.** Keep everything readable as server-rendered Python + light JS.
- **Database**: PostgreSQL via Neon (free tier, no expiry).
- **Hosting**: Render (free tier) for now, deploying via a `Dockerfile`. This must stay a portable, standard Docker setup — no Render-specific lock-in — so it can move to a VPS (Hostinger or DigitalOcean) later with no rewrite, just a new deploy target.
- **Domain**: `.com` for now; `.com.bd` possibly added later.
- **Spec workflow**: OpenSpec. Every feature gets a spec in `openspec/changes/` (proposal → design → tasks) reviewed and approved *before* implementation starts.

## Working rules for Claude Code

1. **One feature at a time.** Don't build ahead of the current spec.
2. **I read every diff.** Keep changes small and scoped to what the spec says — if a diff would be large, break it into smaller steps instead.
3. **Stop and ask before**: changing the database schema, adding a new dependency, or touching anything outside the current spec's stated scope.
4. **Explain non-obvious code** briefly in comments or in your response — I'm backend-comfortable but still learning Django's conventions and frontend patterns (HTMX/Alpine).
5. **Match the visual/tone direction** in this file (and any Claude Design mockup screenshots I share) — minimal, wood tones, generous whitespace, subtle animations, not flashy.

## Core data model (target shape, build incrementally)

- `Product` — name, slug, description, price, category, status (active/coming_soon), images
- `ProductImage` — product FK, image, order, alt text
- `Order` — customer info, items, status, payment method, total
- `OrderItem` — order FK, product FK, quantity, price at order time
- `EmailSubscriber` — email, source, subscribed_at, consent
- `DeliverySlip` — order FK, courier, tracking status, notes

## Admin panel

Django admin is the single dashboard for: orders needing action, delivery status, and the email subscriber list. Customize list views/filters as real usage patterns emerge — don't over-build this before there's real data.

## Roadmap (build in this order)

1. MVP: catalog (2 live products + coming-soon placeholders), product detail pages, about/contact, email signup
2. Orders v1: cart, checkout, manual payment (bKash number shown, "I've paid" confirmation), admin order management
3. Admin polish: custom dashboard views, CSV export for email list
4. bKash API integration (real payment verification)
5. Steadfast API integration (auto delivery creation + tracking sync)

## Explicitly not yet in scope

- bKash / Steadfast API integration (phases 4–5 only)
- `.com.bd` domain setup
- Any React/Next.js frontend
- Multi-language support
