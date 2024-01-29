import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from "@astrojs/preact";
import prefetch from "@astrojs/prefetch";
import purgecss from "astro-purgecss";
import svgSprite from "astro-svg-sprite";
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [
    mdx(),
    preact(),
    prefetch(), // Prefetch page links when the link becomes visible on screen
    svgSprite({
      include: ['./src/assets/images/sprites'],
    }),
    tailwind({
      // don't autogenerate base style sheet and inject it
      applyBaseStyles: false,
    }),
    purgecss(), // PurgeCSS should be last item in integrations array
  ],
})
