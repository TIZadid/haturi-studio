# Adding a product

1. Copy `src/content/products/_template/` to `src/content/products/<slug>/` (lowercase, dashes). The slug becomes the URL `/products/<slug>`.
2. Put a 4:5 straight-on `hero.jpg` in the folder, plus any gallery photos.
3. Fill in `index.md`. `npm run build` tells you exactly which field is wrong.
4. Optional reel: `npm run encode -- "<path to source video>" src/content/products/<slug>` creates `reel.mp4` and `reel-poster.jpg`, then add `reel: { file: reel.mp4, poster: ./reel-poster.jpg }`.
5. Optional 3D: only `medal-hanger` and `grid-shelf` models exist. New models go in `src/scripts/three/models/` and must be added to `MODEL_KINDS` in `src/lib/product-schema.ts`.
6. `npm run dev`, check the home page row and the product page, then commit and push. Cloudflare Pages rebuilds automatically.

Folders starting with `_` are ignored.
