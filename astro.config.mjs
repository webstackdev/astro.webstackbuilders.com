import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import mdx from '@astrojs/mdx'
import purgecss from "astro-purgecss"

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      // don't autogenerate base style sheet and inject it
      applyBaseStyles: false
    }),
    mdx(),
    // PurgeCSS should be last item in integrations array
    purgecss(),
  ]
})
