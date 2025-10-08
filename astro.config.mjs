import { loadEnv } from "vite"
import { defineConfig, envField } from 'astro/config'
import AstroPWA from '@vite-pwa/astro'
import mdx from '@astrojs/mdx'
import preact from "@astrojs/preact"
import { rehypeTailwindClasses } from './src/lib/markdown/rehype-tailwind-classes.ts'
import remarkToc from 'remark-toc'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
// TailwindCSS v4 using CSS imports instead of Vite plugin (to avoid type conflicts)
// import svgSprite from "astro-svg-sprite"

const { DEV_SERVER_PORT, PREVIEW_SERVER_PORT } = loadEnv('production', process.cwd(), "")

const getSiteUrl = () => {
  switch (process.env['NODE_ENV']) {
    case 'production':
      console.log(
        `Using production environment.`
      )
      return 'https://webstackbuilders.com'
    case 'development':
      console.log(
        `Using development environment on port ${DEV_SERVER_PORT ?? 4321}.`
      )
      return `https://localhost:${DEV_SERVER_PORT ?? 4321}`
    case 'test':
      console.log(
        `Using test environment on port ${DEV_SERVER_PORT ?? 4321}.`
      )
      return `https://localhost:${PREVIEW_SERVER_PORT ?? 4321}`
    default:
      console.log(
        `The NODE_ENV environment variable is not set, using "production".`
      )
      return 'https://webstackbuilders.com'
  }
}

export default defineConfig({
  /** Site name accessible using import.meta.env.SITE */
  site: getSiteUrl(),
  integrations: [
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Webstack Builders',
        short_name: 'WSB',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          // ... more icons
        ]
      },
      workbox: {
        // ID to be prepended to cache names
        cacheId: 'webstackbuilders',
        // identify and delete precaches created by older service workers
        cleanupOutdatedCaches: true,
        // whether the service worker should start controlling any existing clients on activation
        clientsClaim: true,
        // add an unconditional call to skipWaiting() to the generated service worker
        skipWaiting: true,
        // fallback for navigation requests
        navigateFallback: '/offline',
        // track and cache all files that match this glob pattern
        globPatterns: ['**/*.{js,html,css,png,jpg,gif,woff2,svg,ico,txt}'],
        // caching strategy configuration
        runtimeCaching: [
          {
            urlPattern: /\.(?:html|css|js)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'webstackbuilders-cache',
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|bmp|webp|svg|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'webstackbuilders-cache',
            },
          },
          {
            urlPattern: /^.*\/offline\/?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'webstackbuilders-offline-page',
            },
          },
        ],
      }
    }),
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: { theme: 'dracula' },
      remarkPlugins: [
        [remarkToc, { heading: "contents" }]
      ],
      rehypePlugins: [
        // Automatically add Tailwind classes to markdown elements
        rehypeTailwindClasses,
        [rehypeAccessibleEmojis, { emoticon: true }]
      ],
      remarkRehype: {
        footnoteLabel: 'Footnotes',
        footnoteBackLabel: "Back to reference 1"
      },
      gfm: true, // GitHub Flavored Markdown
    }),
    preact(),
  ],
  /**
   * Env var usage:
   *
   *   import { SERVER_API_URL } from "astro:env/server";
   *   <script>import { API_URL } from "astro:env/client";</script>
   */
  env: {
    schema: {
      /**
       * Public client variables end up in both the final client and server bundles, and can
       * be accessed from both client and server through the astro:env/client module. Public
       * server variables end up in the final server bundle. Secret server variables are not
       * part of the final server bundle and are only validated at runtime.
       */
      DEV_SERVER_PORT: envField.number({
        context: "server",
        access: "public",
        optional: true,
        default: 4321,
      }),
      PREVIEW_SERVER_PORT: envField.number({
        context: "server",
        access: "public",
        optional: true,
        default: 4321,
      }),
    }
  },
  prefetch: true,
})