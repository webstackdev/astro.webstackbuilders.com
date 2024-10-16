import { join } from 'path'
import type { GenerateSWOptions } from 'workbox-build'

const WorkboxConfig: GenerateSWOptions = {
  // ID to be prepended to cache names
  cacheId: 'webstackbuilders',
  // identify and delete precaches created by older service workers
  cleanupOutdatedCaches: true,
  // whether the service worker should start controlling any existing clients on activation
  clientsClaim: true,
  // local directory relative to the current directory to match globPatterns against
  globDirectory: './public/',
  // track and cache all files that match this glob pattern
  // prettier-ignore
  globPatterns: ['**\/*.{js,html,css,png,jpg,gif,woff2}'],
  // caching strategy to use
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
  ],
  // add an unconditional call to skipWaiting() to the generated service worker
  skipWaiting: true,
  // name of the service worker file created, must be in root directory to cover entire site
  swDest: join('./public/', 'service-worker.js'),
}

export default WorkboxConfig
