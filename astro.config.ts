import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import vercelStatic from '@astrojs/vercel'
import sentry from "@sentry/astro"
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
} from './src/lib/config'
import { callToActionValidator } from './src/integrations/CtaValidator/call-to-action-validator'
import { serializeSitemapItem, writePagesJson } from './src/lib/config/sitemap-serialize'

// Type guard for required environment variables (only in Vercel)
const IS_VERCEL = process.env['VERCEL']
const SENTRY_AUTH_TOKEN = process.env['SENTRY_AUTH_TOKEN']
if (IS_VERCEL && !SENTRY_AUTH_TOKEN) {
  throw new Error('SENTRY_AUTH_TOKEN environment variable is required in Vercel but not set')
}

export default defineConfig({
  adapter: vercelStatic(vercelConfig),
  devToolbar: {
    enabled: false,
  },
  env: environmentalVariablesConfig,
  integrations: [
    AstroPWA(serviceWorkerConfig),
    icon(),
    mdx(markdownConfig),
    preact(),
    callToActionValidator({
      debug: true // Enable debug logging to see validation details
    }),
    // Only include Sentry integration in Vercel environments
    ...(IS_VERCEL ? [sentry({
      project: "webstack-builders-corporate-website",
      org: "webstack-builders",
      authToken: SENTRY_AUTH_TOKEN!, // Non-null assertion safe due to check above
    })] : []),
    sitemap({
      lastmod: new Date(),
      serialize: serializeSitemapItem,
    }),
    // Custom integration to write pages.json after build
    {
      name: 'pages-json-writer',
      hooks: {
        'astro:build:done': () => {
          writePagesJson()
        },
      },
    },
  ],
  output: 'static', // Most pages are static; API routes will be marked for SSR
  prefetch: true,
  site: getSiteUrl(), // Change URL between development and production environments
  trailingSlash: 'never',
  vite: {
    build: {
      sourcemap: true, // Source map generation must be turned on
    },
    // @ts-expect-error - tailwindcss plugin type compatibility
    plugins: [tailwindcss()],
    // Note: The "astro:transitions sourcemap" warning is cosmetic and can be safely ignored
    // It occurs because the transitions plugin transforms code without generating sourcemaps
    // This doesn't affect build functionality, runtime performance, or debugging capabilities
  }
})
