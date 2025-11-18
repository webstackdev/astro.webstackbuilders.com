/* eslint-disable jsdoc/escape-inline-tags */
// @vitest-environment node
/**
 * ✅ WORKING Container API Reference Implementation
 *
 * This demonstrates the successful pattern for using Astro's Container API
 * with proper Vitest configuration using getViteConfig() from 'astro/config'.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import ContainerComponent from '@components/Test/container.astro'

describe('Container API Reference Implementation', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('should render component with provided title and message', async () => {
    const result = await container.renderToString(ContainerComponent, {
      props: {
        title: 'Test Title',
        message: 'Test Message',
      },
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
        message: 'Click the button',
      },
    })

    const window = new Window()
    const domParser = new window.DOMParser()
    const doc = domParser.parseFromString(result, 'text/html')

    // Test DOM elements from actual Astro component
    const titleElement = doc.querySelector('h2.test-title')
    const messageElement = doc.querySelector('p.test-message')
    const buttonElement = doc.querySelector('button.test-button')

    expect(titleElement).toBeTruthy()
    expect(titleElement?.textContent).toBe('Interactive Test')

    expect(messageElement).toBeTruthy()
    expect(messageElement?.textContent).toBe('Click the button')

    expect(buttonElement).toBeTruthy()
    expect(buttonElement?.textContent?.trim()).toBe('Test Button')
    expect(buttonElement?.id).toBe('test-btn')
  })
})
