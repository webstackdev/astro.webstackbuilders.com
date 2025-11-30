/**
 * Tests for no-html-element-assertions ESLint rule
 */

import { describe, it, expect } from 'vitest'
import { RuleTester } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import noHtmlElementAssertionsRule from '@test/eslint/no-html-element-assertions-rule'

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
})

describe('no-html-element-assertions-rule', () => {
  it('should error on HTMLElement type assertion in production code', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const element = document.querySelector('.example') as HTMLElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on HTMLInputElement type assertion', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const input = event.target as HTMLInputElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLInputElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on HTMLButtonElement type assertion', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const button = element as HTMLButtonElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLButtonElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on HTMLFormElement type assertion', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Forms/client.ts',
            code: `
              const form = document.getElementById('myForm') as HTMLFormElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLFormElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on SVGElement type assertion', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Icons/client.ts',
            code: `
              const svg = element as SVGElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'SVGElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should allow non-HTML type assertions', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const value = data as string
              const count = result as number
              const obj = item as MyCustomType
            `,
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })

  it('should allow in test files', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [
          {
            filename: 'src/components/Example/__tests__/client.spec.ts',
            code: `
              const element = document.querySelector('.example') as HTMLElement
              const button = element as HTMLButtonElement
            `,
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })

  it('should warn in error test files', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/__tests__/error.spec.ts',
            code: `
              const element = {} as HTMLElement
            `,
            errors: [
              {
                messageId: 'testFileException',
                data: { elementType: 'HTMLElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should handle multiple violations in one file', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const element = node as HTMLElement
              const input = field as HTMLInputElement
              const button = control as HTMLButtonElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLElement' },
              },
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLInputElement' },
              },
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLButtonElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on HTMLDivElement type assertion', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Example/client.ts',
            code: `
              const div = container as HTMLDivElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLDivElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on HTMLAnchorElement type assertion', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Navigation/client.ts',
            code: `
              const link = element as HTMLAnchorElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLAnchorElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should error on HTMLMetaElement type assertion', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [],
        invalid: [
          {
            filename: 'src/components/Head/client.ts',
            code: `
              const meta = element as HTMLMetaElement
            `,
            errors: [
              {
                messageId: 'noHtmlAssertion',
                data: { elementType: 'HTMLMetaElement' },
              },
            ],
          },
        ],
      })
    }).not.toThrow()
  })

  it('should allow type assertions in assertions/elements.ts file', () => {
    expect(() => {
      ruleTester.run('no-html-element-assertions', noHtmlElementAssertionsRule, {
        valid: [
          {
            filename: 'src/components/scripts/assertions/elements.ts',
            code: `
              export function isInputElement(element: Element): element is HTMLInputElement {
                return element instanceof HTMLInputElement
              }
            `,
          },
        ],
        invalid: [],
      })
    }).not.toThrow()
  })
})
