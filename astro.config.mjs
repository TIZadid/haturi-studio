import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://haturi-studio.zlabz.workers.dev',
  trailingSlash: 'never',
  integrations: [sitemap()],
  vite: {
    build: { assetsInlineLimit: 0 },
    // three is imported lazily; pre-bundle it so the dev server never serves a stale optimized dep
    optimizeDeps: { include: ['three', 'three/examples/jsm/controls/OrbitControls.js', 'gsap', 'gsap/ScrollTrigger', 'lenis'] },
  },
});
