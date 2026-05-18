import { describe, expect, it } from 'vitest'
import { GET, buildServiceWorkerScript, prerender } from '../sw.js'

describe('/sw.js route', () => {
  it('is prerendered for production builds', () => {
    expect(prerender).toBe(true)
  })

  it('returns a JavaScript service worker response', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/javascript; charset=utf-8')
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    expect(response.headers.get('Service-Worker-Allowed')).toBe('/')

    const body = await response.text()
    expect(body).toContain("self.addEventListener('install'")
    expect(body).toContain("self.addEventListener('fetch'")
    expect(body).toContain("const OFFLINE_URL = '/offline'")
  })

  it('builds a stable script payload', () => {
    expect(buildServiceWorkerScript()).toContain('webstackbuilders-offline-v1')
    expect(buildServiceWorkerScript()).toContain('webstackbuilders-images-v1')
  })
})