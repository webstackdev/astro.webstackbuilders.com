import mdx from '@astrojs/mdx'
import preact from "@astrojs/preact"
import vercelStatic from '@astrojs/vercel/static'
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

// Type guard for required environment variables (only in CI)
const IS_CI = process.env['CI'] === 'true'
const SENTRY_AUTH_TOKEN = process.env['SENTRY_AUTH_TOKEN']
if (IS_CI && !SENTRY_AUTH_TOKEN) {
  throw new Error('SENTRY_AUTH_TOKEN environment variable is required in CI but not set')
}

export default defineConfig({
  adapter: vercelStatic(vercelConfig),
  env: environmentalVariablesConfig,
  integrations: [
    AstroPWA(serviceWorkerConfig),
    icon(),
    mdx(markdownConfig),
    preact(),
    // Only include Sentry integration in CI environments
    ...(IS_CI && SENTRY_AUTH_TOKEN ? [sentry({
      project: "webstack-builders-corporate-website",
      org: "webstack-builders",
      authToken: SENTRY_AUTH_TOKEN,
    })] : []),
  ],
  output: 'static',
  prefetch: true,
  site: getSiteUrl(), // Change URL between development and production environments
  trailingSlash: 'never',
  vite: {
    build: {
      sourcemap: true, // Source map generation must be turned on
    },
    // @ts-expect-error - tailwindcss plugin type compatibility
    plugins: [tailwindcss()]
  }
})
