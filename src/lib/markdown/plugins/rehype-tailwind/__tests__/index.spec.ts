import { describe, expect, test } from 'vitest'
import type { Element } from 'hast'
import type { ElementConfig } from '@lib/markdown/plugins/rehype-tailwind/@types'
import {
  htmlElements,
  applyHtmlElementClasses,
  isSimpleHtmlElement,
  getElementConfig,
} from '@lib/markdown/plugins/rehype-tailwind/visitors/simple'

function splitClassTokens(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value !== 'string') return []
  return value
    .split(/\s+/g)
    .map(token => token.trim())
    .filter(Boolean)
}

function isWellFormedCssClassToken(token: string): boolean {
  // We keep this intentionally permissive for Tailwind variants (e.g. `md:hover:...`, `w-1/2`, `!mt-0`).
  // The main goal is to ensure we never emit whitespace/control chars or HTML-breaking characters.
  if (!token) return false

  // Disallow whitespace (including newlines/tabs) and a small set of characters that would mangle HTML.
  if (/[\s"'`{};]/.test(token)) return false

  // Disallow ASCII control characters (0x00-0x1F) and DEL (0x7F).
  for (const char of token) {
    const code = char.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f) return false
  }

  return true
}

function expectHasAtLeastOneValidClass(node: Element): void {
  const tokens = splitClassTokens(node.properties?.['className'])
  expect(tokens.length).toBeGreaterThan(0)
  tokens.forEach(token => {
    expect(isWellFormedCssClassToken(token)).toBe(true)
  })
}

describe('htmlElements configuration', () => {
  test('contains at least the expected element types', () => {
    const tagNames = htmlElements.map(config => config.tagName)
    expect(tagNames.length).toBeGreaterThan(0)
  })

  test('each configuration has required properties', () => {
    htmlElements.forEach(config => {
      expect(config).toHaveProperty('tagName')
      expect(config).toHaveProperty('classes')
      expect(typeof config.tagName).toBe('string')
      expect(Array.isArray(config.classes)).toBe(true)
      expect(config.classes.length).toBeGreaterThan(0)
      config.classes.forEach(classToken => {
        expect(typeof classToken).toBe('string')
        expect(isWellFormedCssClassToken(classToken)).toBe(true)
      })
    })
  })

  test('tag names are unique', () => {
    const tagNames = htmlElements.map(config => config.tagName)
    const uniqueTagNames = new Set(tagNames)
    expect(uniqueTagNames.size).toBe(tagNames.length)
  })

  test('includes all expected element types', () => {
    const expectedElements = [
      'p',
      'img',
      'video',
      'figure',
      'figcaption',
      'hr',
      'ul',
      'ol',
      'li',
      'mark',
      'table',
      'th',
      'td',
      'summary',
      'details',
    ]

    expectedElements.forEach(tagName => {
      const config = htmlElements.find(c => c.tagName === tagName)
      expect(config).toBeDefined()
    })
  })
})

describe('applyHtmlElementClasses', () => {
  test('applies classes to node without existing properties', () => {
    const node: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [],
    }
    const config: ElementConfig = {
      tagName: 'p',
      classes: ['test-class-a', 'test-class-b'],
    }

    applyHtmlElementClasses(node, config)

    expectHasAtLeastOneValidClass(node)
    expect(node.properties?.['className']).toEqual(['test-class-a', 'test-class-b'])
  })

  test('applies classes to node with existing className array', () => {
    const node: Element = {
      type: 'element',
      tagName: 'p',
      properties: {
        className: ['existing-class'],
      },
      children: [],
    }
    const config: ElementConfig = {
      tagName: 'p',
      classes: ['test-class-a', 'test-class-b'],
    }

    applyHtmlElementClasses(node, config)

    expectHasAtLeastOneValidClass(node)
    expect(node.properties?.['className']).toEqual(['existing-class', 'test-class-a', 'test-class-b'])
  })

  test('applies classes to node without properties object', () => {
    const node: Partial<Element> & { type: 'element'; tagName: string; children: [] } = {
      type: 'element',
      tagName: 'p',
      children: [],
    }

    const config: ElementConfig = {
      tagName: 'p',
      classes: ['test-class-a', 'test-class-b'],
    }

    applyHtmlElementClasses(node as Element, config)

    expect(node.properties).toBeDefined()
    expectHasAtLeastOneValidClass(node as Element)
    expect(node.properties?.['className']).toEqual(['test-class-a', 'test-class-b'])
  })

  test('preserves other properties when applying classes', () => {
    const node: Element = {
      type: 'element',
      tagName: 'p',
      properties: {
        id: 'test-id',
        'data-custom': 'value',
      },
      children: [],
    }
    const config: ElementConfig = {
      tagName: 'p',
      classes: ['test-class-a'],
    }

    applyHtmlElementClasses(node, config)

    expect(node.properties?.['id']).toBe('test-id')
    expect(node.properties?.['data-custom']).toBe('value')
    expectHasAtLeastOneValidClass(node)
    expect(node.properties?.['className']).toEqual(['test-class-a'])
  })
})

describe('isSimpleHtmlElement', () => {
  test('returns true when tag names match', () => {
    const node: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [],
    }

    expect(isSimpleHtmlElement(node, 'p')).toBe(true)
  })

  test('returns false when tag names do not match', () => {
    const node: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [],
    }

    expect(isSimpleHtmlElement(node, 'div')).toBe(false)
  })

  test('is case-sensitive', () => {
    const node: Element = {
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [],
    }

    expect(isSimpleHtmlElement(node, 'P')).toBe(false)
  })
})

describe('getElementConfig', () => {
  test('returns config for valid tag name', () => {
    const config = getElementConfig('p')
    expect(config).toBeDefined()
    expect(config?.tagName).toBe('p')
    expect(Array.isArray(config?.classes)).toBe(true)
    expect((config?.classes || []).length).toBeGreaterThan(0)
    ;(config?.classes || []).forEach(classToken => {
      expect(isWellFormedCssClassToken(classToken)).toBe(true)
    })
  })

  test('returns undefined for invalid tag name', () => {
    const config = getElementConfig('invalid-element')
    expect(config).toBeUndefined()
  })

  test('is case-sensitive', () => {
    const config = getElementConfig('P')
    expect(config).toBeUndefined()
  })
})

describe('element class configuration (non-visual assertions)', () => {
  test('every configured element has at least one well-formed class token', () => {
    htmlElements.forEach(config => {
      expect(typeof config.tagName).toBe('string')
      expect(config.tagName.length).toBeGreaterThan(0)
      expect(Array.isArray(config.classes)).toBe(true)
      expect(config.classes.length).toBeGreaterThan(0)

      config.classes.forEach(token => {
        expect(isWellFormedCssClassToken(token)).toBe(true)
      })
    })
  })
})
