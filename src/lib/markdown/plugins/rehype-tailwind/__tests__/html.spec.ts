import { describe, expect, test } from 'vitest'
import type { Element } from 'hast'
import type { ElementConfig } from '../@types/index.js'
import {
  htmlElements,
  applyHtmlElementClasses,
  isSimpleHtmlElement,
  getElementConfig,
} from '../visitors/simple.js'

describe('htmlElements configuration', () => {
  test('contains expected number of element configurations', () => {
    expect(htmlElements).toHaveLength(15)
  })

  test('each configuration has required properties', () => {
    htmlElements.forEach((config) => {
      expect(config).toHaveProperty('tagName')
      expect(config).toHaveProperty('classes')
      expect(typeof config.tagName).toBe('string')
      expect(Array.isArray(config.classes)).toBe(true)
      expect(config.classes.length).toBeGreaterThan(0)
    })
  })

  test('tag names are unique', () => {
    const tagNames = htmlElements.map((config) => config.tagName)
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

    expectedElements.forEach((tagName) => {
      const config = htmlElements.find((c) => c.tagName === tagName)
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
      classes: ['mb-8', 'text-lg'],
    }

    applyHtmlElementClasses(node, config)

    expect(node.properties?.['className']).toEqual(['mb-8', 'text-lg'])
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
      classes: ['mb-8', 'text-lg'],
    }

    applyHtmlElementClasses(node, config)

    expect(node.properties?.['className']).toEqual(['existing-class', 'mb-8', 'text-lg'])
  })

  test('applies classes to node without properties object', () => {
    const node: Partial<Element> & { type: 'element'; tagName: string; children: [] } = {
      type: 'element',
      tagName: 'p',
      children: [],
    }

    const config: ElementConfig = {
      tagName: 'p',
      classes: ['mb-8', 'text-lg'],
    }

    applyHtmlElementClasses(node as Element, config)

    expect(node.properties).toBeDefined()
    expect(node.properties?.['className']).toEqual(['mb-8', 'text-lg'])
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
      classes: ['mb-8'],
    }

    applyHtmlElementClasses(node, config)

    expect(node.properties?.['id']).toBe('test-id')
    expect(node.properties?.['data-custom']).toBe('value')
    expect(node.properties?.['className']).toEqual(['mb-8'])
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
    expect(config?.classes).toContain('mb-8')
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

describe('Paragraph (p) element', () => {
  test('has spacing and typography classes', () => {
    const config = getElementConfig('p')
    expect(config?.classes).toContain('mb-8')
    expect(config?.classes).toContain('text-lg')
    expect(config?.classes).toContain('leading-relaxed')
  })
})

describe('Image (img) element', () => {
  test('has responsive and centering classes', () => {
    const config = getElementConfig('img')
    expect(config?.classes).toContain('block')
    expect(config?.classes).toContain('mx-auto')
    expect(config?.classes).toContain('max-w-full')
    expect(config?.classes).toContain('h-auto')
    expect(config?.classes).toContain('rounded-lg')
    expect(config?.classes).toContain('shadow-md')
  })
})

describe('Video element', () => {
  test('has same classes as img element', () => {
    const imgConfig = getElementConfig('img')
    const videoConfig = getElementConfig('video')
    expect(videoConfig?.classes).toEqual(imgConfig?.classes)
  })
})

describe('Figure element', () => {
  test('has centering and spacing classes', () => {
    const config = getElementConfig('figure')
    expect(config?.classes).toContain('my-8')
    expect(config?.classes).toContain('mx-auto')
    expect(config?.classes).toContain('max-w-none')
    expect(config?.classes).toContain('text-center')
  })
})

describe('Figcaption element', () => {
  test('has typography and spacing classes', () => {
    const config = getElementConfig('figcaption')
    expect(config?.classes).toContain('text-base')
    expect(config?.classes).toContain('italic')
    expect(config?.classes).toContain('pt-3')
  })
})

describe('Horizontal rule (hr) element', () => {
  test('has styling and spacing classes', () => {
    const config = getElementConfig('hr')
    expect(config?.classes).toContain('bg-gray-300')
    expect(config?.classes).toContain('border-0')
    expect(config?.classes).toContain('my-16')
    expect(config?.classes).toContain('mx-auto')
    expect(config?.classes).toContain('w-96')
    expect(config?.classes).toContain('h-px')
  })
})

describe('Unordered list (ul) element', () => {
  test('has list styling and spacing classes', () => {
    const config = getElementConfig('ul')
    expect(config?.classes).toContain('list-disc')
    expect(config?.classes).toContain('list-outside')
    expect(config?.classes).toContain('pl-4')
    expect(config?.classes).toContain('mb-8')
  })
})

describe('Ordered list (ol) element', () => {
  test('has list styling and spacing classes', () => {
    const config = getElementConfig('ol')
    expect(config?.classes).toContain('list-decimal')
    expect(config?.classes).toContain('list-outside')
    expect(config?.classes).toContain('pl-4')
    expect(config?.classes).toContain('mb-8')
  })
})

describe('List item (li) element', () => {
  test('has spacing classes', () => {
    const config = getElementConfig('li')
    expect(config?.classes).toContain('mb-1')
    expect(config?.classes).toContain('last:mb-0')
  })
})

describe('Mark element', () => {
  test('has background and text color classes', () => {
    const config = getElementConfig('mark')
    expect(config?.classes).toContain('bg-gray-300')
    expect(config?.classes).toContain('text-gray-900')
  })
})

describe('Table element', () => {
  test('has table styling classes', () => {
    const config = getElementConfig('table')
    expect(config?.classes).toContain('w-full')
    expect(config?.classes).toContain('border-collapse')
    expect(config?.classes).toContain('border')
    expect(config?.classes).toContain('border-gray-300')
    expect(config?.classes).toContain('dark:border-gray-600')
    expect(config?.classes).toContain('my-6')
    expect(config?.classes).toContain('rounded-lg')
  })
})

describe('Table header (th) element', () => {
  test('has header styling classes', () => {
    const config = getElementConfig('th')
    expect(config?.classes).toContain('bg-gray-100')
    expect(config?.classes).toContain('dark:bg-gray-700')
    expect(config?.classes).toContain('px-4')
    expect(config?.classes).toContain('py-2')
    expect(config?.classes).toContain('text-left')
    expect(config?.classes).toContain('font-semibold')
  })
})

describe('Table data (td) element', () => {
  test('has cell styling classes', () => {
    const config = getElementConfig('td')
    expect(config?.classes).toContain('px-4')
    expect(config?.classes).toContain('py-2')
    expect(config?.classes).toContain('border-b')
  })
})

describe('Summary element', () => {
  test('has interactive styling classes', () => {
    const config = getElementConfig('summary')
    expect(config?.classes).toContain('outline-none')
    expect(config?.classes).toContain('select-none')
    expect(config?.classes).toContain('cursor-pointer')
    expect(config?.classes).toContain('list-none')
    expect(config?.classes).toContain('marker:hidden')
  })
})

describe('Details element', () => {
  test('has content padding classes', () => {
    const config = getElementConfig('details')
    expect(config?.classes).toContain('[&>*:not(summary)]:pl-5')
  })
})
