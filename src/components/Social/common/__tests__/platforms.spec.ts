import { describe, expect, it, vi } from 'vitest'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

describe('Social platform utilities', () => {
  it('copyToClipboard returns false when navigator is unavailable', async () => {
    const globalRef = globalThis as unknown as { navigator?: Navigator }
    const originalNavigator = globalRef.navigator

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    try {
      const { copyToClipboard } = await import('@components/Social/common/platforms')
      await expect(copyToClipboard('hello')).resolves.toBe(false)
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        writable: true,
        value: originalNavigator,
      })
    }
  })

  it('copyToClipboard uses navigator.clipboard when available', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      const globalRef = globalThis as unknown as { navigator?: Navigator }
      const originalNavigator = globalRef.navigator

      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        writable: true,
        value: window.navigator,
      })

      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window.navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      })

      try {
        const { copyToClipboard } = await import('@components/Social/common/platforms')
        await expect(copyToClipboard('hello')).resolves.toBe(true)
        expect(writeText).toHaveBeenCalledWith('hello')
      } finally {
        Object.defineProperty(globalThis, 'navigator', {
          configurable: true,
          writable: true,
          value: originalNavigator,
        })
      }
    })
  })

  it('nativeShare returns false when share is unavailable', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      Object.defineProperty(window.navigator, 'share', {
        configurable: true,
        value: undefined,
      })

      const { nativeShare } = await import('@components/Social/common/platforms')
      await expect(nativeShare({ title: 't', text: 'x', url: 'https://example.com' })).resolves.toBe(false)
    })
  })
})
