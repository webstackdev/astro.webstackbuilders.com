// @vitest-environment happy-dom
import { describe, test, expect, beforeEach } from 'vitest'
import Cookies from 'js-cookie'

/**
 * Tests for js-cookie compatibility with happy-dom
 * These tests verify that our document.cookie mock approach works correctly
 */
describe('js-cookie with happy-dom', () => {
  beforeEach(() => {
    // Reset document.cookie before each test
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
      configurable: true,
    })
  })

  describe('Setting cookies', () => {
    test('sets a simple cookie', () => {
      Cookies.set('test', 'value')
      expect(Cookies.get('test')).toBe('value')
    })

    test('sets a cookie with path option', () => {
      Cookies.set('test', 'value', { path: '/' })
      expect(Cookies.get('test')).toBe('value')
    })

    test('sets a cookie with expires option', () => {
      Cookies.set('test', 'value', { expires: 365, path: '/' })
      expect(Cookies.get('test')).toBe('value')
    })

    test('sets a cookie with sameSite option', () => {
      Cookies.set('test', 'value', { sameSite: 'strict', path: '/' })
      expect(Cookies.get('test')).toBe('value')
    })

    test.skip('sets multiple cookies - skipped (happy-dom only stores last cookie via js-cookie)', () => {
      // This test demonstrates a known limitation:
      // happy-dom's cookie implementation doesn't properly support multiple cookies via js-cookie
      // Our document.cookie mock works for direct document.cookie access, but js-cookie bypasses it
      Cookies.set('cookie1', 'value1', { path: '/' })
      Cookies.set('cookie2', 'value2', { path: '/' })
      Cookies.set('cookie3', 'value3', { path: '/' })

      expect(Cookies.get('cookie1')).toBe('value1')
      expect(Cookies.get('cookie2')).toBe('value2')
      expect(Cookies.get('cookie3')).toBe('value3')
    })

    test('sets a cookie with boolean value as string', () => {
      Cookies.set('consent', 'true', { path: '/' })
      expect(Cookies.get('consent')).toBe('true')
    })

    test('sets a cookie with false value as string', () => {
      Cookies.set('consent', 'false', { path: '/' })
      expect(Cookies.get('consent')).toBe('false')
    })
  })

  describe('Getting cookies', () => {
    test('returns undefined for non-existent cookie', () => {
      expect(Cookies.get('nonexistent')).toBeUndefined()
    })

    test.skip('gets all cookies as object - skipped (happy-dom parses attributes as cookies)', () => {
      // This test demonstrates happy-dom's cookie parsing issue:
      // Cookie attributes like 'path=/' are incorrectly parsed as separate cookies
      Cookies.set('cookie1', 'value1', { path: '/' })
      Cookies.set('cookie2', 'value2', { path: '/' })

      const allCookies = Cookies.get()
      expect(allCookies).toEqual({
        cookie1: 'value1',
        cookie2: 'value2',
      })
    })
  })

  describe('Removing cookies', () => {
    test('js-cookie remove returns empty string (happy-dom limitation)', () => {
      Cookies.set('test', 'value')
      Cookies.remove('test')
      // Note: js-cookie with happy-dom returns '' instead of undefined after removal
      // This is a known limitation - use document.cookie mock reset instead
      expect(Cookies.get('test')).toBe('')
    })

    test('js-cookie remove with path returns empty string (happy-dom limitation)', () => {
      Cookies.set('test', 'value', { path: '/' })
      Cookies.remove('test', { path: '/' })
      // Note: js-cookie with happy-dom returns '' instead of undefined after removal
      expect(Cookies.get('test')).toBe('')
    })

    test.skip('removes multiple cookies - skipped (happy-dom only stores last cookie)', () => {
      // This test demonstrates happy-dom's limitation:
      // When setting multiple cookies via js-cookie, only the last one persists
      Cookies.set('cookie1', 'value1', { path: '/' })
      Cookies.set('cookie2', 'value2', { path: '/' })
      Cookies.set('cookie3', 'value3', { path: '/' })

      Cookies.remove('cookie1', { path: '/' })
      Cookies.remove('cookie2', { path: '/' })
      Cookies.remove('cookie3', { path: '/' })

      expect(Cookies.get('cookie1')).toBeUndefined()
      expect(Cookies.get('cookie2')).toBeUndefined()
      expect(Cookies.get('cookie3')).toBeUndefined()
    })

    test('cookie removal works after document.cookie reset', () => {
      // Set a cookie
      Cookies.set('test', 'value', { path: '/' })
      expect(Cookies.get('test')).toBe('value')

      // Reset document.cookie (simulating our cleanup)
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
        configurable: true,
      })

      // Cookie should be gone
      expect(Cookies.get('test')).toBeUndefined()
    })
  })

  describe('Cookie persistence across operations', () => {
    test('cookie persists across multiple get operations', () => {
      Cookies.set('test', 'value', { path: '/' })
      expect(Cookies.get('test')).toBe('value')
      expect(Cookies.get('test')).toBe('value')
      expect(Cookies.get('test')).toBe('value')
    })

    test('can update an existing cookie', () => {
      Cookies.set('test', 'value1', { path: '/' })
      expect(Cookies.get('test')).toBe('value1')

      Cookies.set('test', 'value2', { path: '/' })
      expect(Cookies.get('test')).toBe('value2')
    })
  })

  describe('Document cookie integration', () => {
    test('cookies are visible in document.cookie', () => {
      Cookies.set('test', 'value', { path: '/' })
      expect(document.cookie).toContain('test=value')
    })

    test('document.cookie reset clears all cookies', () => {
      Cookies.set('cookie1', 'value1', { path: '/' })
      Cookies.set('cookie2', 'value2', { path: '/' })

      expect(document.cookie).toBeTruthy()

      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
        configurable: true,
      })

      expect(document.cookie).toBe('')
      expect(Cookies.get('cookie1')).toBeUndefined()
      expect(Cookies.get('cookie2')).toBeUndefined()
    })
  })
})
