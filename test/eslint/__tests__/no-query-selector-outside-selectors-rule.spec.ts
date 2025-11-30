/**
 * Tests for no-query-selector-outside-selectors ESLint rule
 */

import { describe, it, expect } from 'vitest'
import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import noQuerySelectorOutsideSelectorsRule from '@test/eslint/no-query-selector-outside-selectors-rule'

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

describe('no-query-selector-outside-selectors-rule', () => {
  it('should error on querySelector in implementation files', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const element = document.querySelector('.example')
            `,
            errors: [
              {
                messageId: 'noQuerySelectorOutsideSelectors',
                data: { method: 'querySelector' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on querySelectorAll in implementation files', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const elements = document.querySelectorAll('.example')
            `,
            errors: [
              {
                messageId: 'noQuerySelectorOutsideSelectors',
                data: { method: 'querySelectorAll' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on querySelector with element context', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const container = document.getElementById('container')
              const button = container.querySelector('button')
            `,
            errors: [
              {
                messageId: 'noQuerySelectorOutsideSelectors',
                data: { method: 'querySelector' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should allow querySelector in selectors.ts files', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [
          {
            filename: 'src/components/Example/selectors.ts',
            code: `
              export function getExampleElement(): HTMLElement | null {
                return document.querySelector('.example')
              }
            `,
            languageOptions: {
              parser: tsParser,
              parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
              },
            },
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })

  it('should allow querySelectorAll in selectors.ts files', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [
          {
            filename: 'src/components/Example/selectors.ts',
            code: `
              export function getExampleElements(): NodeListOf<Element> {
                return document.querySelectorAll('.example')
              }
            `,
            languageOptions: {
              parser: tsParser,
              parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
              },
            },
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })

  it('should allow querySelector in test files', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [
          {
            filename: 'src/components/Example/__tests__/client.spec.ts',
            code: `
              const element = document.querySelector('.example')
              expect(element).toBeTruthy()
            `,
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })

  it('should allow querySelectorAll in test files', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [
          {
            filename: 'test/e2e/example.test.ts',
            code: `
              const elements = document.querySelectorAll('.example')
              expect(elements.length).toBeGreaterThan(0)
            `,
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })

  it('should handle multiple violations in one file', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const element1 = document.querySelector('.example')
              const elements = document.querySelectorAll('.items')
              const element2 = element1.querySelector('.nested')
            `,
            errors: [
              {
                messageId: 'noQuerySelectorOutsideSelectors',
                data: { method: 'querySelector' },
              },
              {
                messageId: 'noQuerySelectorOutsideSelectors',
                data: { method: 'querySelectorAll' },
              },
              {
                messageId: 'noQuerySelectorOutsideSelectors',
                data: { method: 'querySelector' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should not error on other method calls', () => {
    expect(() => {
      ruleTester.run('no-query-selector-outside-selectors', noQuerySelectorOutsideSelectorsRule, {
        valid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const element = document.getElementById('example')
              const button = document.createElement('button')
              element.classList.add('active')
            `,
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })
})
