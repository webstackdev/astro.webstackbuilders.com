// @vitest-environment happy-dom
/**
 * Tests for commonSetup helper
 * Verifies that state (cookies, localStorage, sessionStorage, DOM)
 * is properly cleared between tests
 */
import { describe, test, expect } from 'vitest'
import { commonSetup } from '../reset'

describe('commonSetup helper', () => {
  // Apply the common setup to all tests in this suite
  commonSetup()

  describe('Cookie cleanup', () => {
    test('sets a cookie in first test', () => {
      document.cookie = 'test_cookie=value1; path=/'
      expect(document.cookie).toContain('test_cookie=value1')
    })

    test('cookie is cleared in second test', () => {
      // Cookie from previous test should be gone
      expect(document.cookie).toBe('')
    })

    test('can set multiple cookies', () => {
      document.cookie = 'cookie1=value1; path=/'
      document.cookie = 'cookie2=value2; path=/'
      expect(document.cookie).toContain('cookie1=value1')
      expect(document.cookie).toContain('cookie2=value2')
    })

    test('multiple cookies are cleared', () => {
      expect(document.cookie).toBe('')
    })
  })

  describe('localStorage cleanup', () => {
    test('sets localStorage item in first test', () => {
      localStorage.setItem('test_key', 'test_value')
      expect(localStorage.getItem('test_key')).toBe('test_value')
    })

    test('localStorage is cleared in second test', () => {
      expect(localStorage.getItem('test_key')).toBeNull()
      expect(localStorage.length).toBe(0)
    })

    test('can set multiple localStorage items', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      expect(localStorage.length).toBe(2)
    })

    test('multiple localStorage items are cleared', () => {
      expect(localStorage.length).toBe(0)
    })
  })

  describe('sessionStorage cleanup', () => {
    test('sets sessionStorage item in first test', () => {
      sessionStorage.setItem('session_key', 'session_value')
      expect(sessionStorage.getItem('session_key')).toBe('session_value')
    })

    test('sessionStorage is cleared in second test', () => {
      expect(sessionStorage.getItem('session_key')).toBeNull()
      expect(sessionStorage.length).toBe(0)
    })
  })

  describe('DOM cleanup', () => {
    test('adds content to document body', () => {
      document.body.innerHTML = '<div id="test">Test Content</div>'
      expect(document.getElementById('test')).toBeTruthy()
      expect(document.body.innerHTML).toContain('Test Content')
    })

    test('document body is cleared in second test', () => {
      expect(document.body.innerHTML).toBe('')
      expect(document.getElementById('test')).toBeNull()
    })
  })

  describe('Combined state cleanup', () => {
    test('sets all types of state', () => {
      // Set cookie
      document.cookie = 'combined_cookie=value; path=/'
      // Set localStorage
      localStorage.setItem('combined_local', 'local_value')
      // Set sessionStorage
      sessionStorage.setItem('combined_session', 'session_value')
      // Set DOM content
      document.body.innerHTML = '<div id="combined">Combined</div>'

      // Verify all set
      expect(document.cookie).toContain('combined_cookie')
      expect(localStorage.getItem('combined_local')).toBe('local_value')
      expect(sessionStorage.getItem('combined_session')).toBe('session_value')
      expect(document.getElementById('combined')).toBeTruthy()
    })

    test('all state is cleared', () => {
      // Verify all cleared
      expect(document.cookie).toBe('')
      expect(localStorage.length).toBe(0)
      expect(sessionStorage.length).toBe(0)
      expect(document.body.innerHTML).toBe('')
    })
  })
})
