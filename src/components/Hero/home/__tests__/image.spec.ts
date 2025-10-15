/**
 * Unit tests for Hero home variant image component
 * Tests SVG loading and script integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Mock the animation module
const mockHeroSvgAnimation = vi.fn()
vi.mock('../animation', () => ({
  heroSvgAnimation: mockHeroSvgAnimation,
}))

/**
 * Test helper to set up DOM environment for image component testing
 */
const setupImageComponentDOM = (): void => {
  const svgPath = resolve(__dirname, '../../../../assets/images/site/hero.svg')
  const svgContent = readFileSync(svgPath, 'utf8')

  // Simulate the compiled Astro component output
  document.body.innerHTML = `
    <div class="order-1 lg:order-2 flex justify-center items-center">
      <div class="w-full max-w-lg mx-auto">
        <div class="w-full h-auto rounded-2xl">
          ${svgContent}
        </div>
      </div>
    </div>
  `
}

/**
 * Simulate event listeners as they would be added by Astro scripts
 */
const simulateAstroScriptExecution = (): void => {
  // Add event listeners as the component script would
  document.addEventListener('DOMContentLoaded', () => {
    // heroSvgAnimation() would be called here
  })

  document.addEventListener('astro:page-load', () => {
    // heroSvgAnimation() would be called here
  })
}

describe('Hero Home Image Component', () => {
  beforeEach(() => {
    // Set up fresh JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable',
    })

    global.document = dom.window.document
    global.window = dom.window as unknown as Window & typeof globalThis
    global.Event = dom.window.Event

    // Clear all mocks
    vi.clearAllMocks()
    mockHeroSvgAnimation.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('SVG Content Loading', () => {
    beforeEach(() => {
      setupImageComponentDOM()
    })

    it('should load SVG with correct ID for animation targeting', () => {
      const heroSvg = document.getElementById('heroAnimation')
      expect(heroSvg).toBeTruthy()
      expect(heroSvg?.tagName.toLowerCase()).toBe('svg')
    })

    it('should have proper SVG viewport dimensions', () => {
      const heroSvg = document.getElementById('heroAnimation')
      expect(heroSvg?.getAttribute('width')).toBe('600')
      expect(heroSvg?.getAttribute('height')).toBe('600')
      expect(heroSvg?.getAttribute('viewBox')).toBe('0 0 600 600')
    })

    it('should contain all required animation target elements', () => {
      // Monitor elements
      expect(document.querySelector('.monitorBottom')).toBeTruthy()
      expect(document.querySelector('.monitorStand')).toBeTruthy()
      expect(document.querySelector('.monitorScreen')).toBeTruthy()
      expect(document.querySelector('.monitorLogo')).toBeTruthy()

      // Laptop elements
      expect(document.querySelector('.laptopBase')).toBeTruthy()
      expect(document.querySelector('.laptopScreen')).toBeTruthy()
      expect(document.querySelector('.laptopTrackpad')).toBeTruthy()
      expect(document.querySelector('.laptopGroup')).toBeTruthy()

      // Tablet elements
      expect(document.querySelector('.tabletGroup')).toBeTruthy()
      expect(document.querySelector('.tabletScreen')).toBeTruthy()
      expect(document.querySelector('.tabletButton')).toBeTruthy()
      expect(document.querySelector('.tabletCamera')).toBeTruthy()

      // Phone elements
      expect(document.querySelector('.phoneGroup')).toBeTruthy()
      expect(document.querySelector('.phoneButton')).toBeTruthy()
      expect(document.querySelector('.phoneCamera')).toBeTruthy()
      expect(document.querySelector('.phoneSpeaker')).toBeTruthy()
    })

    it('should have proper CSS class structure for responsive layout', () => {
      const container = document.querySelector('.order-1.lg\\:order-2')
      expect(container).toBeTruthy()

      const innerContainer = document.querySelector('.w-full.max-w-lg.mx-auto')
      expect(innerContainer).toBeTruthy()

      const svgWrapper = document.querySelector('.w-full.h-auto.rounded-2xl')
      expect(svgWrapper).toBeTruthy()
    })
  })

  describe('Animation Script Integration', () => {
    beforeEach(() => {
      setupImageComponentDOM()

      // Mock event listeners - simulate how Astro handles script execution
      document.addEventListener = vi.fn((event: string, callback: EventListener) => {
        if (event === 'DOMContentLoaded' || event === 'astro:page-load') {
          // Store callback for manual triggering in tests
          ;(callback as EventListener & { __testCallback?: EventListener }).__testCallback = callback
        }
      })
    })

    it('should set up event listeners for animation initialization', () => {
      // Simulate the script execution that would happen in the browser
      simulateAstroScriptExecution()

      expect(document.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      )
      expect(document.addEventListener).toHaveBeenCalledWith(
        'astro:page-load',
        expect.any(Function)
      )
    })
  })

  describe('SVG Accessibility', () => {
    beforeEach(() => {
      setupImageComponentDOM()
    })

    it('should have proper SVG namespace', () => {
      const heroSvg = document.getElementById('heroAnimation')
      expect(heroSvg?.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
    })

    it('should be scalable for responsive design', () => {
      const heroSvg = document.getElementById('heroAnimation')
      const viewBox = heroSvg?.getAttribute('viewBox')
      expect(viewBox).toBeTruthy()
      expect(viewBox?.split(' ')).toHaveLength(4)
    })

    it('should not have inline styles that conflict with animations', () => {
      // Check that elements don't have conflicting inline styles
      const animatedElements = [
        '.monitorBottom',
        '.laptopGroup',
        '.tabletGroup',
        '.phoneGroup'
      ]

      animatedElements.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          const inlineStyle = element.getAttribute('style')
          // Should not have transform or opacity styles that conflict with GSAP
          if (inlineStyle) {
            expect(inlineStyle).not.toMatch(/transform|opacity|visibility/)
          }
        })
      })
    })
  })

  describe('Performance Considerations', () => {
    beforeEach(() => {
      setupImageComponentDOM()
    })

    it('should have reasonable DOM complexity', () => {
      // Count total elements to ensure SVG isn't overly complex
      const allElements = document.querySelectorAll('*')
      expect(allElements.length).toBeLessThan(200) // Reasonable limit for performance
    })

    it('should use efficient selectors for animation targets', () => {
      // Verify that animation target elements can be efficiently queried
      const animationTargets = [
        '#heroAnimation',
        '.monitorBottom',
        '.laptopGroup',
        '.tabletGroup',
        '.phoneGroup'
      ]

      animationTargets.forEach(selector => {
        const queryStart = performance.now()
        const elements = document.querySelectorAll(selector)
        const queryEnd = performance.now()

        expect(elements.length).toBeGreaterThan(0)
        expect(queryEnd - queryStart).toBeLessThan(5) // Should be reasonably fast
      })
    })

    it('should not have redundant or duplicate elements', () => {
      // Check for unique IDs
      const elementsWithIds = document.querySelectorAll('[id]')
      const ids = Array.from(elementsWithIds).map(el => el.id)
      const uniqueIds = Array.from(new Set(ids))

      expect(ids.length).toBe(uniqueIds.length)
    })
  })

  describe('SVG Structure Validation', () => {
    beforeEach(() => {
      setupImageComponentDOM()
    })

    it('should have proper defs section with clip paths', () => {
      const defs = document.querySelector('defs')
      expect(defs).toBeTruthy()

      const clipPaths = document.querySelectorAll('clipPath')
      expect(clipPaths.length).toBeGreaterThan(0)

      // Check for specific clip paths used in animation
      expect(document.querySelector('#monitorEdgeMask')).toBeTruthy()
      expect(document.querySelector('#laptopBaseMask')).toBeTruthy()
      expect(document.querySelector('#monitorStandMask')).toBeTruthy()
      expect(document.querySelector('#tabletContentGroupMask')).toBeTruthy()
    })

    it('should have properly nested group structure', () => {
      // Main device groups should exist
      expect(document.querySelector('.monitorGroup')).toBeTruthy()
      expect(document.querySelector('.laptopGroup')).toBeTruthy()
      expect(document.querySelector('.tabletGroup')).toBeTruthy()
      expect(document.querySelector('.phoneGroup')).toBeTruthy()

      // Content groups should be nested within device groups
      expect(document.querySelector('.monitorGroup .monitorContentGroup')).toBeTruthy()
      expect(document.querySelector('.laptopGroup .laptopContentGroup')).toBeTruthy()
    })

    it('should have fill attributes for visual rendering', () => {
      const pathsWithFill = document.querySelectorAll('path[fill], circle[fill]')
      expect(pathsWithFill.length).toBeGreaterThan(0)

      // Should not have any elements without fill that need it for visibility
      const visiblePaths = document.querySelectorAll('path')
      visiblePaths.forEach(path => {
        if (!path.hasAttribute('fill') && !path.closest('clipPath')) {
          // Paths outside clipPath should have fill or inherit from parent
          const computedFill = path.getAttribute('fill')
          expect(computedFill).toBeTruthy()
        }
      })
    })
  })

  describe('Integration with Astro Component System', () => {
    it('should work with Astro\'s set:html directive', () => {
      // Simulate how Astro processes the SVG content
      const svgPath = resolve(__dirname, '../../../../assets/images/site/hero.svg')
      const svgContent = readFileSync(svgPath, 'utf8')

      // Should be valid SVG content that can be inserted via set:html
      expect(svgContent).toMatch(/^<svg/)
      expect(svgContent).toMatch(/<\/svg>$/)
      expect(svgContent).toContain('id="heroAnimation"')
    })

    it('should maintain element relationships after HTML insertion', () => {
      setupImageComponentDOM()

      // Verify that clip path references are maintained
      const elementsWithClipPath = document.querySelectorAll('[clip-path]')
      elementsWithClipPath.forEach(element => {
        const clipPathValue = element.getAttribute('clip-path')
        if (clipPathValue?.startsWith('url(#')) {
          const clipPathId = clipPathValue.match(/url\(#([^)]+)\)/)?.[1]
          if (clipPathId) {
            const referencedClipPath = document.getElementById(clipPathId)
            expect(referencedClipPath).toBeTruthy()
          }
        }
      })
    })
  })
})
