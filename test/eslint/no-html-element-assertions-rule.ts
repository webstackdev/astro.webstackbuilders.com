/**
 * ESLint rule to prevent unsafe HTML element type assertions
 * Enforces using type guards instead of "as HTMLElement" casts
 */

import type { Rule } from 'eslint'

const noHtmlElementAssertionsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent unsafe HTML element type assertions (e.g., "as HTMLInputElement"). Use type guards from @components/scripts/assertions/elements instead.',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noHtmlAssertion:
        'Avoid type assertion "as {{ elementType }}". Use type guards (e.g., isInputElement, isButtonElement) from @components/scripts/assertions/elements for runtime safety.',
      testFileException:
        'Test mock objects can use type assertions with `satisfies Partial<{{ elementType }}>` for better type safety.',
    },
    schema: [],
    fixable: undefined,
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const filename = context.filename || context.getFilename()
    const isTestFile = /\.(spec|test)\.ts$/.test(filename)
    const isErrorTestFile = filename.includes('error.spec.ts')

    // HTML element types that should use type guards instead
    const htmlElementTypes = [
      'HTMLElement',
      'HTMLInputElement',
      'HTMLButtonElement',
      'HTMLFormElement',
      'HTMLDivElement',
      'HTMLSpanElement',
      'HTMLAnchorElement',
      'HTMLTextAreaElement',
      'HTMLSelectElement',
      'HTMLLabelElement',
      'HTMLImageElement',
      'HTMLParagraphElement',
      'HTMLHeadingElement',
      'HTMLUListElement',
      'HTMLLIElement',
      'HTMLTableElement',
      'HTMLBodyElement',
      'HTMLHeaderElement',
      'HTMLMetaElement',
      'SVGElement',
      'SVGSVGElement',
    ]

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TSAsExpression(node: any): void {
        const typeAnnotation = node.typeAnnotation

        // Check if it's a type reference (e.g., HTMLInputElement)
        if (typeAnnotation.type === 'TSTypeReference') {
          const typeName =
            typeAnnotation.typeName.type === 'Identifier'
              ? typeAnnotation.typeName.name
              : null

          if (typeName && htmlElementTypes.includes(typeName)) {
            // Allow in error test files for mock objects (but still flag as warning)
            if (isErrorTestFile) {
              context.report({
                node,
                messageId: 'testFileException',
                data: {
                  elementType: typeName,
                },
              })
              return
            }

            // Stricter enforcement in non-test files
            if (!isTestFile) {
              context.report({
                node,
                messageId: 'noHtmlAssertion',
                data: {
                  elementType: typeName,
                },
              })
            }
          }
        }
      },
    }
  },
}

export default noHtmlElementAssertionsRule
