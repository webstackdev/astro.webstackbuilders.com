import { loadEnv } from "vite"
import { defineConfig, envField } from 'astro/config'
import AstroPWA from '@vite-pwa/astro'
import mdx from '@astrojs/mdx'
import preact from "@astrojs/preact"
// TailwindCSS v4 using CSS imports instead of Vite plugin (to avoid type conflicts)
// import svgSprite from "astro-svg-sprite"
// import remarkToc from 'remark-toc'
// import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'

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
        navigateFallback: '/404',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}']
      }
    }),
    mdx(/*{
      syntaxHighlight: 'shiki', // 'prism'
      shikiConfig: { theme: 'dracula' },
      remarkPlugins: [ [remarkToc, { heading: "contents"} ] ],
      rehypePlugins: [rehypeAccessibleEmojis],
      remarkRehype: { footnoteLabel: 'Footnotes', footnoteBackLabel: "Back to reference 1" },
      gfm: false, // default is true
    }*/),
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