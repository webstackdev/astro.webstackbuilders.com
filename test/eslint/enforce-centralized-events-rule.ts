/**
 * ESLint rule to enforce centralized event listener patterns
 * Prevents direct use of addEventListener for specific event types that should use
 * the centralized utilities in src/components/Scripts/elementListeners/index.ts
 */

import type { Rule } from 'eslint'
import type { CallExpression } from 'estree'

interface EventConfig {
  eventName: string
  suggestedUtility: string
  description: string
}

const enforceCentralizedEventsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce centralized event handling for click, keyup, touchend, and Escape events',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      useCentralizedUtility:
        'Use `{{ utility }}` from `elementListeners` for {{ description }} instead of direct addEventListener. This ensures consistent accessibility support ({{ features }}).',
      webComponentException:
        'Web components should use `{{ utility }}` from `elementListeners` with the third `context` parameter set to `this` for proper binding.',
    },
    schema: [],
    fixable: undefined,
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const centralizedHandlerFile = 'src/components/Scripts/elementListeners/index.ts'

    // Map event types to their centralized utilities
    const eventConfigs: EventConfig[] = [
      {
        eventName: 'click',
        suggestedUtility: 'addButtonEventListeners or addLinkEventListeners',
        description: 'click events',
      },
      {
        eventName: 'keyup',
        suggestedUtility:
          'addButtonEventListeners, addLinkEventListeners, or addWrapperEventListeners',
        description: 'keyup events (Enter/Escape)',
      },
      {
        eventName: 'touchend',
        suggestedUtility: 'addButtonEventListeners or addLinkEventListeners',
        description: 'touchend events',
      },
      {
        eventName: 'keydown',
        suggestedUtility: 'keyup with addButtonEventListeners or addWrapperEventListeners',
        description: 'keyboard events (use keyup instead of keydown for better accessibility)',
      },
      {
        eventName: 'keypress',
        suggestedUtility: 'keyup with addButtonEventListeners or addWrapperEventListeners',
        description: 'keyboard events (use keyup instead of deprecated keypress)',
      },
    ]

    /**
     * Detect if the current file is likely a web component
     * Look for class declarations extending HTMLElement in the source code
     */
    function isLikelyWebComponent(_node: CallExpression): boolean {
      // Get the source code to check for class extending HTMLElement
      const sourceCode = context.sourceCode || context.getSourceCode()
      const ast = sourceCode.ast

      // Look for ClassDeclaration or ClassExpression that extends HTMLElement
      let foundWebComponent = false

      function checkNode(astNode: any): void {
        if (!astNode) return

        if (astNode.type === 'ClassDeclaration' || astNode.type === 'ClassExpression') {
          if (
            astNode.superClass &&
            astNode.superClass.type === 'Identifier' &&
            astNode.superClass.name === 'HTMLElement'
          ) {
            foundWebComponent = true
          }
        }

        // Recursively check children
        if (astNode.body) {
          if (Array.isArray(astNode.body)) {
            astNode.body.forEach(checkNode)
          } else {
            checkNode(astNode.body)
          }
        }
      }

      checkNode(ast)
      return foundWebComponent
    }

    /**
     * Get appropriate features list based on event type
     */
    function getFeatures(eventName: string): string {
      switch (eventName) {
        case 'keyup':
        case 'keydown':
        case 'keypress':
          return 'isComposing check, repeat prevention, Enter/Escape key handling'
        case 'click':
        case 'touchend':
          return 'click, keyup Enter, and touchend support'
        default:
          return 'consistent event handling'
      }
    }

    return {
      CallExpression(node: CallExpression) {
        // Check if this is an addEventListener call
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.property.type !== 'Identifier' ||
          node.callee.property.name !== 'addEventListener' ||
          node.arguments.length === 0
        ) {
          return
        }

        const firstArg = node.arguments[0]

        // Check if the first argument is a string literal with a restricted event type
        if (!firstArg || firstArg.type !== 'Literal' || typeof firstArg.value !== 'string') {
          return
        }

        const eventName = firstArg.value as string
        const eventConfig = eventConfigs.find((config) => config.eventName === eventName)

        if (!eventConfig) {
          return
        }

        // Allow this in the centralized handler file itself
        const filename = context.getFilename()
        if (filename.includes(centralizedHandlerFile)) {
          return
        }

        // Determine if this is in a web component
        const isWebComponent = isLikelyWebComponent(node)
        const messageId = isWebComponent ? 'webComponentException' : 'useCentralizedUtility'

        context.report({
          node,
          messageId,
          data: {
            utility: eventConfig.suggestedUtility,
            description: eventConfig.description,
            features: getFeatures(eventName),
          },
        })
      },
    }
  },
}

export default enforceCentralizedEventsRule

