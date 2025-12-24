// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  getSessionStorageItem,
  removeSessionStorageItem,
  setSessionStorageItem,
} from '@components/scripts/storage'

describe('sessionStorage helpers', () => {
  it('reads, writes, and removes values when sessionStorage is available', () => {
    removeSessionStorageItem('test-key')

    expect(getSessionStorageItem('test-key')).toBeNull()
    expect(setSessionStorageItem('test-key', 'hello')).toBe(true)
    expect(getSessionStorageItem('test-key')).toBe('hello')
    expect(removeSessionStorageItem('test-key')).toBe(true)
    expect(getSessionStorageItem('test-key')).toBeNull()
  })

  it('returns safe defaults when sessionStorage is missing', () => {
    const globalRef = globalThis as unknown as { sessionStorage?: Storage }
    const original = globalRef.sessionStorage

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    try {
      expect(getSessionStorageItem('x')).toBeNull()
      expect(setSessionStorageItem('x', 'y')).toBe(false)
      expect(removeSessionStorageItem('x')).toBe(false)
    } finally {
      Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        writable: true,
        value: original,
      })
    }
  })

  it('does not throw when accessing sessionStorage throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })

    try {
      expect(getSessionStorageItem('x')).toBeNull()
      expect(setSessionStorageItem('x', 'y')).toBe(false)
      expect(removeSessionStorageItem('x')).toBe(false)
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'sessionStorage', descriptor)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis as unknown as { sessionStorage?: unknown }).sessionStorage
      }
    }
  })
})
