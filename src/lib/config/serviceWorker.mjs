// @ts-check
/** @typedef {import('@vite-pwa/astro').PwaOptions} PwaOptions */
/** @type { PwaOptions} */
export const serviceWorkerConfig = {
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
}