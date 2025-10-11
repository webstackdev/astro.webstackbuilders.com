import mdx from '@astrojs/mdx'
import preact from "@astrojs/preact"
import vercelStatic from '@astrojs/vercel/static'
import tailwindcss from '@tailwindcss/vite'
import AstroPWA from '@vite-pwa/astro'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import {
  environmentalVariablesConfig,
  getSiteUrl,
  markdownConfig,
  serviceWorkerConfig,
  vercelConfig,
} from './src/lib/config/index.ts'

export default defineConfig({
  /** Site name accessible using import.meta.env.SITE */
  site: getSiteUrl(),
  trailingSlash: 'never',
  output: 'static',
  adapter: vercelStatic(vercelConfig),
  prefetch: true,
  integrations: [
    AstroPWA(serviceWorkerConfig),
    icon(),
    mdx(markdownConfig),
    preact(),
  ],
  env: environmentalVariablesConfig,
  vite: {
    // @ts-expect-error - tailwindcss plugin type compatibility
    plugins: [tailwindcss()]
  }
})
