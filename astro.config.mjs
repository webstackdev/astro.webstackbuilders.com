import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import purgecss from "astro-purgecss";
import prefetch from "@astrojs/prefetch";

import svgSprite from "astro-svg-sprite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      // don't autogenerate base style sheet and inject it
      applyBaseStyles: false,
    }),
    mdx(),
    prefetch(), // Prefetch page links when the link becomes visible on screen
    svgSprite(),
    purgecss(), // PurgeCSS should be last item in integrations array
  ],
})