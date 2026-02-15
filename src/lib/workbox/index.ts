/// <reference lib="webworker" />

import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import type { RouteHandlerCallback, WorkboxPlugin } from 'workbox-core/types.js'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'
import { buildOfflineRedirectUrl } from './url'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>
}

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

const networkOnly = new NetworkOnly()

const navigationHandler: RouteHandlerCallback = async (params) => {
  try {
    return await networkOnly.handle(params)
  } catch {
    return Response.redirect(buildOfflineRedirectUrl(params.request.url), 302)
  }
}

registerRoute(new NavigationRoute(navigationHandler))

registerRoute(
  /\.(?:css|js)$/,
  new StaleWhileRevalidate({
    cacheName: 'webstackbuilders-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }) as unknown as WorkboxPlugin,
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }) as unknown as WorkboxPlugin,
    ],
  })
)

registerRoute(
  /\.(?:png|jpg|jpeg|gif|bmp|webp|svg|ico)$/,
  new CacheFirst({
    cacheName: 'webstackbuilders-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }) as unknown as WorkboxPlugin,
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }) as unknown as WorkboxPlugin,
    ],
  })
)
