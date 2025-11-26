// @vitest-environment jsdom
/**
 * Unit tests for cookie utilities
 * Tests the wrapper functions around js-cookie library
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Cookies from 'js-cookie'
import { getCookie, setCookie, removeCookie, getAllCookies, hasCookie } from '@components/scripts/utils/cookies'

describe('Cookie Utilities', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName)
    })
  })

  afterEach(() => {
    // Clean up after each test
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName)
    })
  })

  describe('getCookie', () => {
    it('should return undefined for non-existent cookie', () => {
      const result = getCookie('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should return cookie value when cookie exists', () => {
      Cookies.set('testCookie', 'testValue')
      const result = getCookie('testCookie')
      expect(result).toBe('testValue')
    })

    it('should return correct value for multiple cookies', () => {
      Cookies.set('cookie1', 'value1')
      Cookies.set('cookie2', 'value2')

      expect(getCookie('cookie1')).toBe('value1')
      expect(getCookie('cookie2')).toBe('value2')
    })
  })

  describe('setCookie', () => {
    it('should set a cookie with default options', () => {
      setCookie('testCookie', 'testValue')

      const result = Cookies.get('testCookie')
      expect(result).toBe('testValue')
    })

    it('should set a cookie with custom expiration', () => {
      setCookie('testCookie', 'testValue', { expires: 7 })

      const result = Cookies.get('testCookie')
      expect(result).toBe('testValue')
    })

    it('should set a cookie with custom path', () => {
      setCookie('testCookie', 'testValue', { path: '/' })

      const result = Cookies.get('testCookie')
      expect(result).toBe('testValue')
    })

    it('should set a cookie with custom sameSite', () => {
      setCookie('testCookie', 'testValue', { sameSite: 'lax' })

      const result = Cookies.get('testCookie')
      expect(result).toBe('testValue')
    })

    it('should override default options with custom options', () => {
      const customOptions = {
        expires: 30,
        sameSite: 'none' as const,
        secure: true,
      }

      setCookie('testCookie', 'testValue', customOptions)

      const result = Cookies.get('testCookie')
      expect(result).toBe('testValue')
    })

    it('should handle empty string values', () => {
      setCookie('emptyCookie', '')

      const result = Cookies.get('emptyCookie')
      expect(result).toBe('')
    })

    it('should handle special characters in cookie values', () => {
      const specialValue = 'value with spaces & special=chars'
      setCookie('specialCookie', specialValue)

      const result = Cookies.get('specialCookie')
      expect(result).toBe(specialValue)
    })
  })

  describe('removeCookie', () => {
    it('should remove an existing cookie', () => {
      Cookies.set('testCookie', 'testValue')
      expect(Cookies.get('testCookie')).toBe('testValue')

      removeCookie('testCookie')

      expect(Cookies.get('testCookie')).toBeUndefined()
    })

    it('should not throw error when removing non-existent cookie', () => {
      expect(() => removeCookie('nonexistent')).not.toThrow()
    })

    it('should only remove the specified cookie', () => {
      Cookies.set('cookie1', 'value1')
      Cookies.set('cookie2', 'value2')

      removeCookie('cookie1')

      expect(Cookies.get('cookie1')).toBeUndefined()
      expect(Cookies.get('cookie2')).toBe('value2')
    })
  })

  describe('getAllCookies', () => {
    it('should return empty object when no cookies exist', () => {
      const result = getAllCookies()
      expect(result).toEqual({})
    })

    it('should return all cookies as an object', () => {
      Cookies.set('cookie1', 'value1')
      Cookies.set('cookie2', 'value2')
      Cookies.set('cookie3', 'value3')

      const result = getAllCookies()

      expect(result).toEqual({
        cookie1: 'value1',
        cookie2: 'value2',
        cookie3: 'value3',
      })
    })

    it('should return updated object after cookie changes', () => {
      Cookies.set('cookie1', 'value1')

      let result = getAllCookies()
      expect(result).toEqual({ cookie1: 'value1' })

      Cookies.set('cookie2', 'value2')

      result = getAllCookies()
      expect(result).toEqual({
        cookie1: 'value1',
        cookie2: 'value2',
      })
    })
  })

  describe('hasCookie', () => {
    it('should return false for non-existent cookie', () => {
      const result = hasCookie('nonexistent')
      expect(result).toBe(false)
    })

    it('should return true for existing cookie', () => {
      Cookies.set('testCookie', 'testValue')

      const result = hasCookie('testCookie')
      expect(result).toBe(true)
    })

    it('should return true even for empty string cookie values', () => {
      Cookies.set('emptyCookie', '')

      const result = hasCookie('emptyCookie')
      expect(result).toBe(true)
    })

    it('should return false after cookie is removed', () => {
      Cookies.set('testCookie', 'testValue')
      expect(hasCookie('testCookie')).toBe(true)

      Cookies.remove('testCookie')

      expect(hasCookie('testCookie')).toBe(false)
    })

    it('should correctly check multiple cookies', () => {
      Cookies.set('existing', 'value')

      expect(hasCookie('existing')).toBe(true)
      expect(hasCookie('nonexistent')).toBe(false)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete cookie lifecycle', () => {
      // Cookie doesn't exist
      expect(hasCookie('lifecycle')).toBe(false)
      expect(getCookie('lifecycle')).toBeUndefined()

      // Set cookie
      setCookie('lifecycle', 'created')
      expect(hasCookie('lifecycle')).toBe(true)
      expect(getCookie('lifecycle')).toBe('created')

      // Update cookie
      setCookie('lifecycle', 'updated')
      expect(getCookie('lifecycle')).toBe('updated')

      // Remove cookie
      removeCookie('lifecycle')
      expect(hasCookie('lifecycle')).toBe(false)
      expect(getCookie('lifecycle')).toBeUndefined()
    })

    it('should handle multiple cookies simultaneously', () => {
      const cookies = {
        session: 'abc123',
        user: 'john_doe',
        theme: 'dark',
        consent: 'granted',
      }

      // Set all cookies
      Object.entries(cookies).forEach(([name, value]) => {
        setCookie(name, value)
      })

      // Verify all exist
      Object.keys(cookies).forEach((name) => {
        expect(hasCookie(name)).toBe(true)
      })

      // Verify getAllCookies returns all
      const allCookies = getAllCookies()
      expect(allCookies).toEqual(cookies)

      // Remove one cookie
      removeCookie('session')

      // Verify remaining cookies
      expect(hasCookie('session')).toBe(false)
      expect(hasCookie('user')).toBe(true)
      expect(hasCookie('theme')).toBe(true)
      expect(hasCookie('consent')).toBe(true)
    })

    it('should preserve cookie values when setting with different options', () => {
      setCookie('test', 'value1', { expires: 7 })
      expect(getCookie('test')).toBe('value1')

      setCookie('test', 'value2', { expires: 30 })
      expect(getCookie('test')).toBe('value2')
    })
  })
})
