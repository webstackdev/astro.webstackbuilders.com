/**
 * ESLint rule to enforce centralized event listener patterns
 * Prevents direct use of addEventListener for specific event types that should use
 * the centralized utilities in src/components/scripts/elementListeners/index.ts
 */

import type { Rule } from 'eslint'
import type { CallExpression, Node } from 'estree'

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
    const centralizedHandlerFile = 'src/components/scripts/elementListeners/index.ts'

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
      const sourceCode = context.sourceCode
      if (!sourceCode) {
        return false
      }
      const ast = sourceCode.ast

      // Look for ClassDeclaration or ClassExpression that extends HTMLElement
      let foundWebComponent = false
      const visitorKeys = sourceCode.visitorKeys ?? {}

      const isHTMLElementSubclass = (node: Node): boolean => {
        if (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression') {
          return false
        }

        const superClass = node.superClass
        return Boolean(
          superClass &&
          superClass.type === 'Identifier' &&
          superClass.name === 'HTMLElement',
        )
      }

      const checkNode = (astNode: Node | null | undefined): void => {
        if (!astNode || foundWebComponent) return

        if (isHTMLElementSubclass(astNode)) {
          foundWebComponent = true
          return
        }

        const keys = visitorKeys[astNode.type] ?? []
        for (const key of keys) {
          const value = (astNode as unknown as Record<string, unknown>)[key]
          if (Array.isArray(value)) {
            for (const child of value) {
              if (child && typeof child === 'object') {
                checkNode(child as Node)
                if (foundWebComponent) return
              }
            }
          } else if (value && typeof value === 'object') {
            checkNode(value as Node)
            if (foundWebComponent) return
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
        const filename = context.filename ?? ''
        if (filename.includes(centralizedHandlerFile)) {
          return
        }

        // Allow document and window level listeners (can't use element-specific utilities)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          (node.callee.object.name === 'document' || node.callee.object.name === 'window')
        ) {
          return
        }

        // Allow this.addEventListener in web components (the component itself is the event target)
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'ThisExpression' &&
          isLikelyWebComponent(node)
        ) {
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

