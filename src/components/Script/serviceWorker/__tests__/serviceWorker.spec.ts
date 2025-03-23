/// <reference path="../../../../../../@types/service-worker-mock/index.d.ts" />

/**
 * From the docs: The service worker mock is best used by applying its result to the global
 * scope, then calling `require('../sw.js')` with the path to your service worker file. The
 * file will use the global mocks for things like adding event listeners.
 */

import { existsSync } from 'fs'
import { afterEach, beforeEach, describe, /*expect,*/ test } from '@jest/globals'
import makeServiceWorkerEnv from 'service-worker-mock'
import type { Global } from '@jest/types'

const serviceWorkerPath = `../../../../../../public/service-worker.js`
const condition = existsSync(serviceWorkerPath)
const describeIf = (...args: [Global.BlockNameLike, Global.BlockFn]) => {
  if (condition) {
    describe(...args)
  } else {
    console.log(
      `[skipped] Tests skipped because service-worker.js has not been generated in 'public' directory:\n> ${args[0]}`
    )
    describe.skip(...args)
  }
}

// @TODO: DefinitelyTyped typings were bad for this module, see <rootDir>/@types/service-worker-mock
//        SWM is from Pinterest and unmaintained

beforeEach(() => {
  /**
   * Pinterest's service worker mock is not maintained.
   *
   * `Object.assign(global, makeServiceWorkerEnv())` no longer puts `EventTarget` methods
   * like `addEventListener` into the global scope because they are no longer "own"
   * properties of `ServiceWorkerGlobalScope`. Workaround is to make `addEventListener`
   * an enumerable property.
   */
  const serviceWorkerEnvInstance = makeServiceWorkerEnv()

  Object.defineProperty(serviceWorkerEnvInstance, 'addEventListener', {
    //value: serviceWorkerEnvInstance.addEventListener,
    enumerable: true,
  })

  Object.assign(global, serviceWorkerEnvInstance)
  jest.resetModules()
})

/* eslint-disable no-restricted-globals, security/detect-non-literal-require */
describeIf('Service worker', () => {
  test.skip('should add listeners', () => {
    require(serviceWorkerPath)
    //await self.trigger('install')
    //expect(self.listeners.get('install')).toBeDefined()
    //expect(self.listeners.get('activate')).toBeDefined()
    //expect(self.listeners.get('fetch')).toBeDefined()
  })

  test.skip('should delete old caches on activate', async () => {
    require(serviceWorkerPath)
    // Create old cache
    await self.caches.open('OLD_CACHE')
    //expect(self.snapshot().caches.OLD_CACHE).toBeDefined()
    // Activate and verify old cache is removed
    //await self.trigger('activate')
    //expect(self.snapshot().caches.OLD_CACHE).toStrictEqual({})
  })

  test.skip('should return a cached response', async () => {
    require(serviceWorkerPath)
    const cachedResponse = { clone: () => {}, data: { key: 'value' } } as unknown as Response
    const cachedRequest = new Request('/test')
    const cache = await self.caches.open('TEST')
    await cache.put(cachedRequest, cachedResponse)
    //await self.trigger('fetch', cachedRequest)
    //expect(self.snapshot().caches.TEST).toMatchInlineSnapshot()
  })
})

describeIf('Service worker fetch calls', () => {
  let fetchMock: jest.SpyInstance<Promise<Response>>
  beforeEach(() => {
    const mockResponse = {
      clone: () => {
        return { data: { key: 'value' } }
      },
      headers: {
        Authorization: `Basic ZGVtbzpwQDU1dzByZA==`,
      },
    } as unknown as Response

    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation((_: RequestInfo | URL, __?: RequestInit) =>
        Promise.resolve(mockResponse)
      )
  })

  afterEach(() => {
    fetchMock.mockClear()
  })

  test.skip('should fetch and cache an uncached request', () => {
    require(serviceWorkerPath)
    //const request = new Request('/test')
    //await self.trigger('fetch', request)
    //expect(fetchMock).toHaveBeenCalledWith('/test')
  })

  test.skip('should ignore requests to external URLs', () => {
    require(serviceWorkerPath)
    //const request = new Request('http://example.com')
    //await self.trigger('fetch', request)
    //expect(self.snapshot().caches).toMatchInlineSnapshot()
  })
})
/* eslint-enable no-restricted-globals, security/detect-non-literal-require */
