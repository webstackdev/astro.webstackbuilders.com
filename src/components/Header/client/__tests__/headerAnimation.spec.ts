// @vitest-environment jsdom
/**
 * Unit tests for Header Animation (WAAPI two-step collapse/expand)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  animateCollapse,
  animateExpand,
  HEADER_TRANSITION_DURATION,
  isHeaderAnimating,
} from '../headerAnimation'

// Mock error handler
vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

// ============================================================================
// HELPERS
// ============================================================================

/** Create a minimal header DOM structure for testing. */
function createHeaderDOM() {
  const shell = document.createElement('div')
  shell.className = 'header-shell'

  const footprint = document.createElement('div')
  footprint.className = 'header-footprint'
  footprint.style.height = '60px'

  const fixed = document.createElement('div')
  fixed.className = 'header-fixed'

  const header = document.createElement('header')
  header.className = 'site-header'
  header.style.paddingTop = '12px'
  header.style.paddingBottom = '12px'

  const brand = document.createElement('span')
  brand.className = 'header-brand'
  brand.style.transform = 'scale(1)'

  const icon1 = document.createElement('span')
  icon1.className = 'header-icon'
  icon1.style.width = '42px'
  icon1.style.height = '42px'

  const icon2 = document.createElement('span')
  icon2.className = 'header-icon'
  icon2.style.width = '42px'
  icon2.style.height = '42px'

  const nav = document.createElement('span')
  nav.className = 'header-nav'
  const link1 = document.createElement('a')
  link1.style.fontSize = '16px'
  link1.textContent = 'Home'
  const link2 = document.createElement('a')
  link2.style.fontSize = '16px'
  link2.textContent = 'About'
  nav.appendChild(link1)
  nav.appendChild(link2)

  header.appendChild(brand)
  header.appendChild(nav)
  header.appendChild(icon1)
  header.appendChild(icon2)
  fixed.appendChild(header)
  shell.appendChild(footprint)
  shell.appendChild(fixed)
  document.body.appendChild(shell)

  return { shell, footprint, header, brand, icon1, icon2, nav, link1, link2 }
}

// jsdom doesn't implement Element.animate — provide a stub
function stubAnimate() {
  const mockAnimation = {
    finished: Promise.resolve(),
    cancel: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
  }

  Element.prototype.animate = vi
    .fn()
    .mockReturnValue(mockAnimation) as unknown as typeof Element.prototype.animate
  return mockAnimation
}

// ============================================================================
// TESTS
// ============================================================================

describe('headerAnimation', () => {
  let dom: ReturnType<typeof createHeaderDOM>

  beforeEach(() => {
    dom = createHeaderDOM()
    stubAnimate()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('HEADER_TRANSITION_DURATION', () => {
    it('should be 320ms', () => {
      expect(HEADER_TRANSITION_DURATION).toBe(320)
    })
  })

  describe('animateCollapse', () => {
    it('should add is-collapsed class after animation completes', async () => {
      expect(dom.shell.classList.contains('is-collapsed')).toBe(false)

      await animateCollapse(dom.shell)

      expect(dom.shell.classList.contains('is-collapsed')).toBe(true)
    })

    it('should call Element.animate on animated elements', async () => {
      await animateCollapse(dom.shell)

      // brand + siteHeader + footprint + 2 icons + 2 nav links = 7 calls
      expect(Element.prototype.animate).toHaveBeenCalled()
      const callCount = vi.mocked(Element.prototype.animate).mock.calls.length
      expect(callCount).toBeGreaterThanOrEqual(3) // at minimum brand, header, footprint
    })

    it('should pass the correct duration to animate', async () => {
      await animateCollapse(dom.shell)

      const calls = vi.mocked(Element.prototype.animate).mock.calls
      calls.forEach(([, options]) => {
        const opts = options as KeyframeAnimationOptions
        expect(opts.duration).toBe(HEADER_TRANSITION_DURATION)
      })
    })

    it('should be a no-op if already collapsed', async () => {
      dom.shell.classList.add('is-collapsed')

      await animateCollapse(dom.shell)

      expect(Element.prototype.animate).not.toHaveBeenCalled()
    })

    it('should snap to target on error', async () => {
      // Make animate throw
      Element.prototype.animate = vi.fn().mockImplementation(() => {
        throw new Error('WAAPI not supported')
      }) as unknown as typeof Element.prototype.animate

      await animateCollapse(dom.shell)

      // Should still have the class applied (snap to target)
      expect(dom.shell.classList.contains('is-collapsed')).toBe(true)
    })
  })

  describe('animateExpand', () => {
    it('should remove is-collapsed class after animation completes', async () => {
      dom.shell.classList.add('is-collapsed')

      await animateExpand(dom.shell)

      expect(dom.shell.classList.contains('is-collapsed')).toBe(false)
    })

    it('should call Element.animate on animated elements', async () => {
      dom.shell.classList.add('is-collapsed')

      await animateExpand(dom.shell)

      expect(Element.prototype.animate).toHaveBeenCalled()
    })

    it('should be a no-op if already expanded', async () => {
      await animateExpand(dom.shell)

      expect(Element.prototype.animate).not.toHaveBeenCalled()
    })
  })

  describe('isHeaderAnimating', () => {
    it('should return false when no animation is running', () => {
      expect(isHeaderAnimating()).toBe(false)
    })

    it('should return false after animation completes', async () => {
      await animateCollapse(dom.shell)
      expect(isHeaderAnimating()).toBe(false)
    })
  })

  describe('keyframe structure', () => {
    it('should create 3-keyframe sequences for each element', async () => {
      await animateCollapse(dom.shell)

      const calls = vi.mocked(Element.prototype.animate).mock.calls
      calls.forEach(([keyframes]) => {
        const kf = keyframes as Keyframe[]
        expect(kf).toHaveLength(3)
        expect(kf[0]?.offset).toBe(0)
        expect(kf[1]?.offset).toBe(0.5)
        expect(kf[2]?.offset).toBe(1)
      })
    })
  })

  describe('missing elements', () => {
    it('should snap to target when header elements are missing', async () => {
      // Remove the site-header to make queryElements return null
      const siteHeader = dom.shell.querySelector('.site-header')
      siteHeader?.remove()

      await animateCollapse(dom.shell)

      // Should still apply the class directly when elements are missing
      expect(dom.shell.classList.contains('is-collapsed')).toBe(true)
      expect(Element.prototype.animate).not.toHaveBeenCalled()
    })
  })
})
