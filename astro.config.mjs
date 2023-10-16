import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import mdx from '@astrojs/mdx'

export default defineConfig({
  integrations: [
    tailwind({
      // don't autogenerate base style sheet and inject it
      applyBaseStyles: false,
    }),
    mdx(),
  ],
})
