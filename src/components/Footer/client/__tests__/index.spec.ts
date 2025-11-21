import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Footer } from '@components/Footer/client'

// Mock the selectors module
vi.mock('@components/Footer/selectors')

import { getHireMeAnchorElement } from '@components/Footer/client/selectors'

// No MockDate needed, using fake timers for Date

describe('Footer', () => {
  const mockAnchor = {
    innerHTML: '',
    style: {
      display: '',
    },
  }

  beforeEach(() => {
    ;(getHireMeAnchorElement as any).mockReturnValue(mockAnchor)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-10-17'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should update hire me anchor with current date on init', () => {
    const anchor = {
      ...mockAnchor,
      innerHTML: 'Old text',
      style: { ...mockAnchor.style, display: 'none' },
    }

    ;(getHireMeAnchorElement as any).mockReturnValue(anchor)

    Footer.init()

    expect(anchor.innerHTML).toBe('Available September, 2024. Hire Me Now')
    expect(anchor.style.display).toBe('inline-block')
  })

  it('should handle pause', () => {
    expect(() => Footer.pause()).not.toThrow()
  })

  it('should handle resume', () => {
    expect(() => Footer.resume()).not.toThrow()
  })

  it('should handle reset', () => {
    expect(() => Footer.reset()).not.toThrow()
  })
})
