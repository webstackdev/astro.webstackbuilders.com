import type { PwaOptions } from '@vite-pwa/astro'
import contactData from '../../content/contact.json'
import themeConfig from '../../content/themes.json'

const buildThemeColor = (): string => {
  const themes = themeConfig.themes || []
  const defaultThemeId = themeConfig.defaultTheme?.id
  const defaultTheme = themes.find(theme => theme.id === defaultThemeId) || themes[0]

  return defaultTheme?.colors?.backgroundOffset || '#111827'
}

const manifestThemeColor = buildThemeColor()

export const pwaConfig: PwaOptions = {
  mode: 'production',
  base: '/',
  scope: '/',
  includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
  devOptions: {
    enabled: true,
    navigateFallbackAllowlist: [/./],
  },
  manifestFilename: 'manifest.json',
  registerType: 'autoUpdate',
  /**
   * Options for manifest.json generation
   */
  manifest: {
    background_color: '#f3f4f6',
    description: contactData.company.description,
    dir: 'ltr',
    display_override: ['window-controls-overlay'],
    display: 'browser',
    lang: 'en_US',
    name: contactData.company.name,
    orientation: 'natural',
    /** Make the app non-installable as a stand-alone PWA */
    prefer_related_applications: true,
    short_name: contactData.company.name,
    start_url: '/index.html',
    theme_color: manifestThemeColor,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-mask.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  /**
   * Options for Workbox service worker generation
   */
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
    // ensure the offline page is always available for navigation fallback
    additionalManifestEntries: [{ url: '/offline', revision: null }],
    // caching strategy configuration
    runtimeCaching: [
      {
        urlPattern: /\.(?:css|js)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'webstackbuilders-assets',
          cacheableResponse: {
            statuses: [0, 200],
          },
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|gif|bmp|webp|svg|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'webstackbuilders-images',
          cacheableResponse: {
            statuses: [0, 200],
          },
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
}
