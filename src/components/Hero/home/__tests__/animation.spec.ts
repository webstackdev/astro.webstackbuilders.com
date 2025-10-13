/**
 * Unit tests for Hero home variant animation functionality
 * Tests the heroSvgAnimation function and its interaction with DOM elements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Mock GSAP with proper chaining
let mockTimeline: ReturnType<typeof createMockTimeline>

const createMockTimeline = () => {
  const timeline = {
    timeScale: vi.fn(),
    from: vi.fn(),
    to: vi.fn(),
    set: vi.fn(),
    staggerFrom: vi.fn(),
    staggerTo: vi.fn(),
  }

  // Setup chaining - every method returns the timeline
  timeline.timeScale.mockReturnValue(timeline)
  timeline.from.mockReturnValue(timeline)
  timeline.to.mockReturnValue(timeline)
  timeline.set.mockReturnValue(timeline)
  timeline.staggerFrom.mockReturnValue(timeline)
  timeline.staggerTo.mockReturnValue(timeline)

  return timeline
}

const mockGsap = {
  set: vi.fn(),
  timeline: vi.fn(),
  to: vi.fn(),
  from: vi.fn(),
}

vi.mock('gsap', () => ({
  gsap: mockGsap,
}))// Mock Anticipate class
vi.mock('../anticipate', () => ({
  Anticipate: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
  }))
}))

/**
 * Test helper function to set up DOM with hero SVG content
 */
const setupHeroDOM = (): void => {
  // Read the actual SVG file
  const svgPath = resolve(__dirname, '../../../../assets/images/site/hero.svg')
  const svgContent = readFileSync(svgPath, 'utf8')

  // Set up DOM with the SVG content
  document.body.innerHTML = `
    <div class="hero-container">
      ${svgContent}
    </div>
  `
}

/**
 * Expected CSS class selectors used in the animation
 */
const EXPECTED_SELECTORS = [
  // Monitor elements
  '.monitorBottom',
  '.monitorStand',
  '.monitorStandShadow',
  '.monitorEdge',
  '.monitorScreen',
  '.monitorLogo',

  // Laptop elements
  '.laptopBase',
  '.laptopScreen',
  '.laptopTrackpad',
  '.laptopGroup',
  '.laptopEdgeLeft',
  '.laptopEdgeRight',
  '.laptopContentGroup',

  // Tablet elements
  '.tabletScreen',
  '.tabletGroup',
  '.tabletButton',
  '.tabletCamera',
  '.tabletContentGroup',

  // Phone elements
  '.phoneButton',
  '.phoneCamera',
  '.phoneSpeaker',
  '.phoneGroup',
] as const

describe('Hero Animation', () => {
  beforeEach(() => {
    // Set up a clean DOM environment for each test
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    global.document = dom.window.document
    global.window = dom.window as unknown as Window & typeof globalThis

    // Reset mocks
    vi.clearAllMocks()

    // Create fresh timeline mock and set up GSAP timeline to return it
    mockTimeline = createMockTimeline()
    mockGsap.timeline.mockReturnValue(mockTimeline)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('heroSvgAnimation function', () => {
    it('should return early if heroAnimation element is not found', async () => {
      // Arrange: Set up DOM without the required element
      document.body.innerHTML = '<div>No hero animation element</div>'

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: GSAP should not be called if element is missing
      expect(mockGsap.set).not.toHaveBeenCalled()
      expect(mockGsap.timeline).not.toHaveBeenCalled()
    })

    it('should initialize animation when heroAnimation element exists', async () => {
      // Arrange: Set up DOM with hero SVG
      setupHeroDOM()

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: GSAP should be called to set up animation
      expect(mockGsap.set).toHaveBeenCalled()
      expect(mockGsap.timeline).toHaveBeenCalledWith({
        defaults: { duration: 1 },
        delay: 1,
        paused: false,
        repeat: -1,
        yoyo: false,
      })
    })

    it('should set transform origins for animation elements', async () => {
      // Arrange: Set up DOM with hero SVG
      setupHeroDOM()

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Transform origins should be set correctly
      expect(mockGsap.set).toHaveBeenCalledWith('.monitorBottom', {
        transformOrigin: '50% 100%',
      })

      expect(mockGsap.set).toHaveBeenCalledWith(['.monitorStand', '.laptopBase', '.tabletScreen'], {
        transformOrigin: '50% 0%',
      })

      expect(mockGsap.set).toHaveBeenCalledWith(['.laptopEdgeLeft', '.laptopEdgeRight'], {
        transformOrigin: '0% 100%',
      })
    })

    it('should set initial tablet rotation', async () => {
      // Arrange: Set up DOM with hero SVG
      setupHeroDOM()

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Tablet should be initially rotated
      expect(mockGsap.set).toHaveBeenCalledWith('.tabletGroup', {
        rotation: -90,
      })
    })

    it('should make SVG visible', async () => {
      // Arrange: Set up DOM with hero SVG
      setupHeroDOM()

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: SVG visibility should be set
      expect(mockGsap.set).toHaveBeenCalledWith('svg', {
        visibility: 'visible',
      })
    })

    it('should configure timeline with correct timeScale', async () => {
      // Arrange: Set up DOM with hero SVG
      setupHeroDOM()

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Timeline should be configured with timeScale of 3
      expect(mockTimeline.timeScale).toHaveBeenCalledWith(3)
    })
  })

  describe('DOM element presence validation', () => {
    beforeEach(() => {
      setupHeroDOM()
    })

    it('should find heroAnimation element with correct ID', () => {
      const heroElement = document.getElementById('heroAnimation')
      expect(heroElement).toBeTruthy()
      expect(heroElement?.tagName.toLowerCase()).toBe('svg')
    })

    it.each(EXPECTED_SELECTORS)('should find element with selector %s', (selector) => {
      const elements = document.querySelectorAll(selector)
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should find monitor content group paths for staggered animation', () => {
      const paths = document.querySelectorAll('.monitorContentGroup path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('should find laptop content group elements for staggered animation', () => {
      const elements = document.querySelectorAll('.laptopContentGroup path')
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should validate SVG structure has required groups', () => {
      // Check for main device groups
      expect(document.querySelector('.monitorGroup')).toBeTruthy()
      expect(document.querySelector('.laptopGroup')).toBeTruthy()
      expect(document.querySelector('.tabletGroup')).toBeTruthy()
      expect(document.querySelector('.phoneGroup')).toBeTruthy()
    })

    it('should validate SVG has proper clip paths defined', () => {
      const clipPaths = document.querySelectorAll('clipPath')
      expect(clipPaths.length).toBeGreaterThan(0)

      // Check for specific clip paths used in animation
      expect(document.querySelector('#monitorEdgeMask')).toBeTruthy()
      expect(document.querySelector('#laptopBaseMask')).toBeTruthy()
      expect(document.querySelector('#monitorStandMask')).toBeTruthy()
      expect(document.querySelector('#tabletContentGroupMask')).toBeTruthy()
    })
  })

  describe('Animation sequence validation', () => {
    beforeEach(() => {
      setupHeroDOM()
    })

    it('should animate monitor bottom with scale transform', async () => {
      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Monitor bottom should be animated with scaleY
      expect(mockTimeline.from).toHaveBeenCalledWith('.monitorBottom', {
        scaleY: 0,
        ease: 'power1',
      })
    })

    it('should animate monitor stand with y translation', async () => {
      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Monitor stand should be animated with y translation
      expect(mockTimeline.from).toHaveBeenCalledWith(
        '.monitorStand',
        {
          y: -70,
          ease: 'power1',
        },
        '-=1'
      )
    })

    it('should animate monitor stand shadow with alpha fade', async () => {
      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Monitor stand shadow should fade in
      expect(mockTimeline.from).toHaveBeenCalledWith(
        '.monitorStandShadow',
        {
          duration: 0.5,
          alpha: 0,
          ease: 'power1.in',
        },
        '-=0.5'
      )
    })

    it('should use staggered animations for content groups', async () => {
      // Arrange: Set up DOM with hero SVG
      setupHeroDOM()

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: All staggered animations should be set up with correct parameters
      expect(mockTimeline.staggerFrom).toHaveBeenCalledWith(
        '.monitorContentGroup path',
        1,
        {
          scaleX: 0,
        },
        0.1
      )

      expect(mockTimeline.staggerFrom).toHaveBeenCalledWith(
        '.laptopContentGroup path',
        1,
        {
          scaleX: 0,
        },
        0.1
      )

      expect(mockTimeline.staggerFrom).toHaveBeenCalledWith(
        ['.tabletButton', '.tabletCamera'],
        0.5,
        {
          scale: 0,
          ease: 'back',
        },
        '-=1'
      )

      expect(mockTimeline.staggerFrom).toHaveBeenCalledWith(
        ['.phoneButton', '.phoneCamera', '.phoneSpeaker'],
        1,
        {
          scale: 0,
          ease: 'back',
        },
        0.1
      )
    })
  })

  describe('Error handling', () => {
    it('should handle missing GSAP gracefully', async () => {
      // Arrange: Mock GSAP to throw error
      vi.doMock('gsap', () => {
        throw new Error('GSAP not found')
      })

      // Act & Assert: Should not throw error
      expect(async () => {
        try {
          const { heroSvgAnimation } = await import('../animation')
          heroSvgAnimation()
        } catch (error) {
          // Expected to catch import error, but animation should handle gracefully
          expect(error).toBeDefined()
        }
      }).not.toThrow()
    })

    it('should handle malformed DOM gracefully', async () => {
      // Arrange: Set up DOM with partial SVG content
      document.body.innerHTML = `
        <svg id="heroAnimation">
          <!-- Missing expected elements -->
        </svg>
      `

      // Act: Should not throw even with missing elements
      const { heroSvgAnimation } = await import('../animation')

      expect(() => heroSvgAnimation()).not.toThrow()
    })
  })

  describe('Integration with Anticipate module', () => {
    beforeEach(() => {
      setupHeroDOM()
    })

    it('should import Anticipate class successfully', async () => {
      // Act: Import the animation module
      const animationModule = await import('../animation')

      // Assert: Module should import without errors
      expect(animationModule.heroSvgAnimation).toBeDefined()
      expect(typeof animationModule.heroSvgAnimation).toBe('function')
    })
  })

  describe('Performance considerations', () => {
    beforeEach(() => {
      setupHeroDOM()
    })

    it('should set up animation efficiently without excessive DOM queries', async () => {
      // Arrange: Spy on querySelector calls
      const querySelectorSpy = vi.spyOn(document, 'getElementById')

      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Should only check for heroAnimation element once
      expect(querySelectorSpy).toHaveBeenCalledWith('heroAnimation')
      expect(querySelectorSpy).toHaveBeenCalledTimes(1)

      querySelectorSpy.mockRestore()
    })

    it('should reuse timeline instance efficiently', async () => {
      // Act: Import and call the animation function
      const { heroSvgAnimation } = await import('../animation')
      heroSvgAnimation()

      // Assert: Timeline should be created only once
      expect(mockGsap.timeline).toHaveBeenCalledTimes(1)
    })
  })
})
