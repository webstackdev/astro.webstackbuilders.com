// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { FooterElement } from '@components/Footer/client'

// Mock the selectors module
vi.mock('@components/Footer/client/selectors', () => ({
  getHireMeAnchorElement: vi.fn(),
}))

import { getHireMeAnchorElement } from '@components/Footer/client/selectors'

describe('FooterElement', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-10-17'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('updates the hire me anchor with availability copy when connected', () => {
    const anchor = {
      innerHTML: '',
      style: { display: 'none' },
    } as unknown as HTMLAnchorElement
    ;(getHireMeAnchorElement as Mock).mockReturnValue(anchor)

    const element = new FooterElement()
    element.connectedCallback()

    expect(getHireMeAnchorElement).toHaveBeenCalledWith(element)
    expect(anchor.innerHTML).toBe('Available September, 2024. Hire Me Now')
    expect(anchor.style.display).toBe('inline-block')
  })
})
