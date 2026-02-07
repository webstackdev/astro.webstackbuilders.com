/**
 * ESLint rule to prevent querySelector/querySelectorAll usage outside of selectors files
 * Enforces centralized DOM query management in dedicated selectors.ts files
 */

import type { Rule } from 'eslint'

interface RuleOptions {
  allowedFiles?: string[]
}

const normalizePath = (value: string): string => value.replaceAll('\\', '/')

const stripVirtualQuery = (value: string): string => value.split('?')[0] ?? value

const isAllowedBySuffix = (filename: string, allowedFiles: string[]): boolean => {
  const normalized = stripVirtualQuery(normalizePath(filename))
  return allowedFiles.some((suffix) => {
    const normalizedSuffix = stripVirtualQuery(normalizePath(suffix))
    return normalized.endsWith(normalizedSuffix) || normalized.includes(normalizedSuffix)
  })
}

const noQuerySelectorOutsideSelectorsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent querySelector/querySelectorAll usage outside of selectors.ts files. Centralize DOM queries in dedicated selectors files for better maintainability.',
      recommended: true,
    },
    messages: {
      noQuerySelectorOutsideSelectors:
        'Avoid using {{ method }} directly. Move DOM queries to a selectors.ts file and use typed getter functions instead.',
      selectorsFileAllowed:
        'querySelector/querySelectorAll are allowed in selectors.ts files.',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowedFiles: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
    fixable: undefined,
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    // Some processors (e.g. Astro) may behave differently; normalize for matching.
    const filename = stripVirtualQuery(normalizePath(context.filename ?? ''))
    const options = (context.options?.[0] ?? {}) as RuleOptions
    const allowedFiles = options.allowedFiles ?? []

    const isTestFile = /\.(spec|test)\.(ts|tsx)$/.test(filename)
    const isSelectorsFile = filename.endsWith('/selectors.ts') || filename.endsWith('selectors.ts')

    if (allowedFiles.length > 0 && isAllowedBySuffix(filename, allowedFiles)) {
      return {}
    }

    // Allow querySelector in test files and selectors files
    if (isTestFile || isSelectorsFile) {
      return {}
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CallExpression(node: any): void {
        const callee = node.callee

        // Optional chaining may wrap calls in ChainExpression.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maybeCall = (callee?.type === 'ChainExpression' ? callee.expression : callee) as any

        // Check for querySelector or querySelectorAll method calls
        if (maybeCall?.type === 'MemberExpression') {
          const methodName = maybeCall.property?.name

          if (methodName === 'querySelector' || methodName === 'querySelectorAll') {
            context.report({
              node,
              messageId: 'noQuerySelectorOutsideSelectors',
              data: {
                method: methodName,
              },
            })
          }
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ChainExpression(node: any): void {
        const expression = node.expression
        if (!expression || expression.type !== 'CallExpression') {
          return
        }

        const callee = expression.callee
        if (callee?.type !== 'MemberExpression') {
          return
        }

        const methodName = callee.property?.name
        if (methodName === 'querySelector' || methodName === 'querySelectorAll') {
          context.report({
            node,
            messageId: 'noQuerySelectorOutsideSelectors',
            data: {
              method: methodName,
            },
          })
        }
      },
    }
  },
}

export default noQuerySelectorOutsideSelectorsRule
