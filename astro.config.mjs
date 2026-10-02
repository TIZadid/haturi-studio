import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://haturi.pages.dev',
  integrations: [sitemap()],
  vite: { build: { assetsInlineLimit: 0 } },
});
