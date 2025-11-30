/**
 * ESLint rule to prevent querySelector/querySelectorAll usage outside of selectors files
 * Enforces centralized DOM query management in dedicated selectors.ts files
 */

import type { Rule } from 'eslint'

const noQuerySelectorOutsideSelectorsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prevent querySelector/querySelectorAll usage outside of selectors.ts files. Centralize DOM queries in dedicated selectors files for better maintainability.',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noQuerySelectorOutsideSelectors:
        'Avoid using {{ method }} directly. Move DOM queries to a selectors.ts file and use typed getter functions instead.',
      selectorsFileAllowed:
        'querySelector/querySelectorAll are allowed in selectors.ts files.',
    },
    schema: [],
    fixable: undefined,
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const filename = context.filename ?? ''
    const isTestFile = /\.(spec|test)\.ts$/.test(filename)
    const isSelectorsFile = filename.endsWith('selectors.ts')

    // Allow querySelector in test files and selectors files
    if (isTestFile || isSelectorsFile) {
      return {}
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CallExpression(node: any): void {
        const callee = node.callee

        // Check for querySelector or querySelectorAll method calls
        if (callee.type === 'MemberExpression') {
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
        }
      },
    }
  },
}

export default noQuerySelectorOutsideSelectorsRule
