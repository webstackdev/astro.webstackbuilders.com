// @vitest-environment jsdom
/**
 * Unit tests for ReadingProgressBar web component
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ReadingProgressBar, registerProgressBarComponent } from '../index'

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: vi.fn(),
}))

vi.mock('@components/scripts/utils', () => ({
  defineCustomElement: vi.fn((tagName: string, ctor: CustomElementConstructor) => {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, ctor)
    }
  }),
}))

// ============================================================================
// HELPERS
// ============================================================================

function createDOM(contentHeight = 2000) {
  const component = document.createElement('reading-progress-bar') as ReadingProgressBar
  component.setAttribute('data-progress-bar', '')

  const progress = document.createElement('progress')
  progress.max = 100
  progress.value = 0
  component.appendChild(progress)
  document.body.appendChild(component)

  const content = document.createElement('div')
  content.id = 'content'
  // Mock getBoundingClientRect for content
  content.getBoundingClientRect = vi.fn().mockReturnValue({
    top: 0,
    height: contentHeight,
    bottom: contentHeight,
    left: 0,
    right: 800,
    width: 800,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  })
  document.body.appendChild(content)

  return { component, progress, content }
}

// ============================================================================
// TESTS
// ============================================================================

describe('ReadingProgressBar', () => {
  beforeEach(async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((_cb: FrameRequestCallback) => {
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    // Ensure the custom element is registered
    await registerProgressBarComponent()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('registration', () => {
    it('should call defineCustomElement with the correct tag name', async () => {
      const { defineCustomElement } = await import('@components/scripts/utils')
      await registerProgressBarComponent()
      expect(defineCustomElement).toHaveBeenCalledWith('reading-progress-bar', ReadingProgressBar)
    })
  })

  describe('component', () => {
    it('should set registeredName to reading-progress-bar', () => {
      expect(ReadingProgressBar.registeredName).toBe('reading-progress-bar')
    })

    it('should use light DOM', () => {
      const el = new ReadingProgressBar()
      expect((el as unknown as { createRenderRoot: () => unknown }).createRenderRoot()).toBe(el)
    })

    it('should start progress at 0', () => {
      const { progress } = createDOM()
      expect(progress.value).toBe(0)
    })
  })

  describe('progress calculation', () => {
    it('should compute progress based on content position', () => {
      const { progress, content } = createDOM(2000)

      const instance = document.createElement('reading-progress-bar') as unknown as {
        progressEl: HTMLProgressElement
        contentEl: HTMLElement
        updateProgress: () => void
      }
      instance.progressEl = progress
      instance.contentEl = content

      vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
        top: -500,
        height: 2000,
        bottom: 1500,
        left: 0,
        right: 800,
        width: 800,
        x: 0,
        y: -500,
        toJSON: vi.fn(),
      })

      instance.updateProgress()

      expect(progress.value).toBeGreaterThan(0)
      expect(progress.value).toBeLessThanOrEqual(100)
    })

    it('should clamp progress to 0-100 range', () => {
      const { progress, content } = createDOM(2000)

      const instance = document.createElement('reading-progress-bar') as unknown as {
        progressEl: HTMLProgressElement
        contentEl: HTMLElement
        updateProgress: () => void
      }
      instance.progressEl = progress
      instance.contentEl = content

      vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
        top: -5000,
        height: 2000,
        bottom: -3000,
        left: 0,
        right: 800,
        width: 800,
        x: 0,
        y: -5000,
        toJSON: vi.fn(),
      })

      instance.updateProgress()

      expect(progress.value).toBe(100)
    })

    it('should set 100% when content fits within one viewport', () => {
      const { progress, content } = createDOM(500)

      const instance = document.createElement('reading-progress-bar') as unknown as {
        progressEl: HTMLProgressElement
        contentEl: HTMLElement
        updateProgress: () => void
      }
      instance.progressEl = progress
      instance.contentEl = content

      vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        height: 500,
        bottom: 600,
        left: 0,
        right: 800,
        width: 800,
        x: 0,
        y: 100,
        toJSON: vi.fn(),
      })

      instance.updateProgress()

      expect(progress.value).toBe(100)
    })
  })
})
