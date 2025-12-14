import { describe, expect, it } from 'vitest'
import {
  buildButtonClassList,
  resolveAriaLabel,
  isIconOnly,
  type ButtonStyleModule,
} from '../index'

type ClassList = Record<string, boolean>

const mockStyles: ButtonStyleModule = {
  button: 'btn',
  sizeSmall: 'btn--small',
  sizeMedium: 'btn--medium',
  sizeLarge: 'btn--large',
  variantPrimary: 'btn--primary',
  variantSecondary: 'btn--secondary',
  variantTwitter: 'btn--twitter',
  variantSuccess: 'btn--success',
  variantWarning: 'btn--warning',
  variantIcon: 'btn--icon',
}

describe('Button server helpers', () => {
  describe('buildButtonClassList', () => {
    it('includes base, size, and variant classes', () => {
      const classList = buildButtonClassList({
        styles: mockStyles,
        variant: 'secondary',
        size: 'large',
      })

      expect(classList).toMatchObject<ClassList>({
        [mockStyles.button]: true,
        [mockStyles.sizeLarge]: true,
        [mockStyles.variantSecondary]: true,
      })
    })

    it('appends additional classes when provided', () => {
      const classList = buildButtonClassList({
        styles: mockStyles,
        additionalClasses: 'custom extra-class',
      })

      expect(classList['custom']).toBe(true)
      expect(classList['extra-class']).toBe(true)
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
        'Button: icon-only buttons must provide ariaLabel',
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
