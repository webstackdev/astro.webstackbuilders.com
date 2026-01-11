import { describe, expect, it } from 'vitest'
import { buildButtonClassList, resolveAriaLabel, isIconOnly } from '../index'

type ClassList = Record<string, boolean>

describe('Button server helpers', () => {
  describe('buildButtonClassList', () => {
    it('includes base, size, and variant classes', () => {
      const classList = buildButtonClassList({
        variant: 'secondary',
        size: 'large',
      })

      expect(classList).toMatchObject<ClassList>({
        'inline-flex': true,
        'py-4': true,
        'px-8': true,
        'bg-secondary': true,
      })
    })

    it('appends additional classes when provided', () => {
      const classList = buildButtonClassList({
        additionalClasses: 'custom extra-class',
      })

      expect(classList['custom']).toBe(true)
      expect(classList['extra-class']).toBe(true)
    })

    it('supports the spotlight variant', () => {
      const classList = buildButtonClassList({
        variant: 'spotlight',
      })

      expect(classList).toMatchObject<ClassList>({
        'bg-spotlight': true,
        'hover:bg-spotlight-offset': true,
        'focus-visible:bg-spotlight-offset': true,
        'active:bg-spotlight-offset': true,
      })
    })
  })

  describe('resolveAriaLabel', () => {
    it('returns explicit ariaLabel when present', () => {
      const label = resolveAriaLabel({ ariaLabel: 'Custom label' })
      expect(label).toBe('Custom label')
    })

    it('returns undefined when text is visible', () => {
      const label = resolveAriaLabel({ text: 'Submit' })
      expect(label).toBeUndefined()
    })

    it('throws when an icon-only button does not provide ariaLabel', () => {
      expect(() => resolveAriaLabel({ icon: 'arrow-right', iconPosition: 'only' })).toThrow(
        'Button: icon-only buttons must provide ariaLabel'
      )
    })
  })

  describe('isIconOnly', () => {
    it('detects icon-only buttons without text', () => {
      const result = isIconOnly({ icon: 'arrow-right', iconPosition: 'only' })
      expect(result).toBe(true)
    })

    it('returns false when text is provided', () => {
      const result = isIconOnly({ text: 'Download', icon: 'arrow-right', iconPosition: 'only' })
      expect(result).toBe(false)
    })
  })
})
