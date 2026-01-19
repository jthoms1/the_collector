import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    preact({ compat: true }),
    tailwind()
  ],
  vite: {
    optimizeDeps: {
      exclude: ['better-sqlite3']
    }
  }
});
