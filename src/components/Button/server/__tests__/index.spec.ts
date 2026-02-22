import { describe, expect, it } from 'vitest'
import { buildButtonClassList, resolveAriaLabel, isIconOnly } from '../index'

type ClassList = Record<string, boolean>

const hasAnyPaddingClasses = (classList: ClassList) => {
  const classNames = Object.keys(classList)
  return classNames.some(className => /(^|:)(p[xy])-/.test(className))
}

describe('Button server helpers', () => {
  describe('buildButtonClassList', () => {
    it('includes base, size, and variant classes', () => {
      const largeSecondary = buildButtonClassList({
        variant: 'secondary',
        size: 'large',
      })

      const smallSecondary = buildButtonClassList({
        variant: 'secondary',
        size: 'small',
      })

      // Avoid brittle assertions on exact Tailwind spacing values; verify stable invariants instead.
      expect(largeSecondary).toMatchObject<ClassList>({
        'inline-flex': true,
        'bg-secondary': true,
      })

      expect(hasAnyPaddingClasses(largeSecondary)).toBe(true)
      expect(largeSecondary).not.toEqual(smallSecondary)
    })

    it('appends additional classes when provided', () => {
      const classList = buildButtonClassList({
        additionalClasses: 'custom extra-class',
      })

      expect(classList['custom']).toBe(true)
      expect(classList['extra-class']).toBe(true)
    })

    it('adds icon-only structural classes when icon-only props are provided', () => {
      const classList = buildButtonClassList({
        variant: 'primary',
        icon: 'close',
        iconPosition: 'only',
      })

      expect(classList['aspect-square']).toBe(true)
      expect(classList['p-2']).toBe(true)
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
