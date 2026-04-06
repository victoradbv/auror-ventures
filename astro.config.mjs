// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://aurorventures.com', // update if domain changes
  vite: {
    plugins: [tailwindcss()]
  }
});