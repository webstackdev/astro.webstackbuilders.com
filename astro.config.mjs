import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import purgecss from "astro-purgecss";

import prefetch from "@astrojs/prefetch";

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      // don't autogenerate base style sheet and inject it
      applyBaseStyles: false,
    }),
    mdx(),
    /** Prefetch page links when they are visible on screen */
    prefetch(),
    /** PurgeCSS should be last item in integrations array */
    purgecss(),
  ],
})