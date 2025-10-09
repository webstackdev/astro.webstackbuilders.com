import mdx from '@astrojs/mdx'
import preact from "@astrojs/preact"
import vercelStatic from '@astrojs/vercel/static'
import tailwindcss from '@tailwindcss/vite'
import AstroPWA from '@vite-pwa/astro'
import { defineConfig, envField } from 'astro/config'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import remarkEmoji from 'remark-emoji'
import remarkToc from 'remark-toc'
import { loadEnv } from "vite"
import { rehypeTailwindClasses } from './src/lib/markdown/rehype-tailwind-classes.ts'
// import svgSprite from "astro-svg-sprite"

/* eslint-disable no-undef */
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
  trailingSlash: 'never',
  output: 'static',
  adapter: vercelStatic({
    /** Whether to use Vercel's image service */
    //imageService: true,
    /** Image service used to optimize images in dev environment */
    //devImageService: "sharp",
    //imagesConfig: {
      /**
       * Supported image widths.
       */
      //sizes: number[];
      /**
       * Allowed external domains that can use Image Optimization. Set to `[]` to only allow the deployment domain to use Image Optimization.
       */
      //domains?: string[];
      /**
       * Allowed external patterns that can use Image Optimization. Similar to `domains` but provides more control with RegExp.
       */
      //remotePatterns?: RemotePattern[];
      /**
       * Cache duration (in seconds) for the optimized images.
       */
      //minimumCacheTTL?: number;
      /**
       * Supported output image formats
       */
      //formats?: ImageFormat[];
      /**
       * Allow SVG input image URLs. This is disabled by default for security purposes.
       */
      //dangerouslyAllowSVG?: boolean;
      /**
       * Change the [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) of the optimized images.
       */
      //contentSecurityPolicy?: string;
    //},
    /** Maximum time in seconds that Lambda functions can run */
    maxDuration: 30,
    /** Whether to use Vercel's web analytics features */
    //webAnalytics: {
    //  enabled: true,
    //},
  }),
  prefetch: true,
  integrations: [
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Webstack Builders',
        // eslint-disable-next-line camelcase
        short_name: 'WSB',
        // eslint-disable-next-line camelcase
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
      shikiConfig: {
        themes: {
          light: 'github-light',
          dark: 'github-dark'
        }
      },
      remarkPlugins: [
        remarkEmoji,
        [remarkToc, { heading: "contents" }]
      ],
      rehypePlugins: [
        // Automatically add Tailwind classes to markdown elements
        rehypeTailwindClasses,
        rehypeAccessibleEmojis
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
   * import { SERVER_API_URL } from "astro:env/server";
   * <script>import { API_URL } from "astro:env/client";</script>
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
  vite: {
    // @ts-expect-error - tailwindcss plugin type compatibility
    plugins: [tailwindcss()]
  }
})