/* eslint-disable jsdoc/escape-inline-tags */
// @vitest-environment node
/**
 * ✅ WORKING Container API Reference Implementation
 *
 * This demonstrates the successful pattern for using Astro's Container API
 * with proper Vitest configuration using getViteConfig() from 'astro/config'.
 *
 * IMPORTANT: Container API requires @vitest-environment node due to esbuild issues in jsdom.
 * For DOM testing, use JSDOM manually within the node environment.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { JSDOM } from 'jsdom'
import ContainerComponent from '../container.astro'

describe('Container API Reference Implementation', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('should render component with provided title and message', async () => {
    const result = await container.renderToString(ContainerComponent, {
      props: {
        title: 'Test Title',
        message: 'Test Message'
      }
    })

    expect(result).toContain('Test Title')
    expect(result).toContain('Test Message')
    expect(result).toContain('<h2 class="test-title"')
    expect(result).toContain('<p class="test-message"')
  })

  it('should render component with default props', async () => {
    const result = await container.renderToString(ContainerComponent)

    expect(result).toContain('Test Component')
    expect(result).toContain('This is a test message')
  })

  it('should render interactive elements and populate DOM correctly', async () => {
    const result = await container.renderToString(ContainerComponent, {
      props: {
        title: 'Interactive Test',
        message: 'Click the button'
      }
    })

    // Create JSDOM instance for DOM testing in node environment
    const dom = new JSDOM(result)
    const document = dom.window.document

    // Test DOM elements from actual Astro component
    const titleElement = document.querySelector('h2.test-title')
    const messageElement = document.querySelector('p.test-message')
    const buttonElement = document.querySelector('button.test-button')

    expect(titleElement).toBeTruthy()
    expect(titleElement?.textContent).toBe('Interactive Test')

    expect(messageElement).toBeTruthy()
    expect(messageElement?.textContent).toBe('Click the button')

    expect(buttonElement).toBeTruthy()
    expect(buttonElement?.textContent?.trim()).toBe('Test Button')
    expect(buttonElement?.id).toBe('test-btn')
  })

  it('should demonstrate the Container API advantage over manual HTML', () => {
    // ✅ GOOD: Using Container API with actual Astro component
    // - Always in sync with template changes
    // - Includes proper CSS classes and attributes
    // - Validates props and component logic
    // - Includes Astro's development attributes for debugging

    expect(true).toBe(true) // This test documents the approach
  })
})