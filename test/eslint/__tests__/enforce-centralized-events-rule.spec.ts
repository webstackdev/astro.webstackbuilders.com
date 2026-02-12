/**
 * Unit tests for the enforce-centralized-events ESLint rule
 */

import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import enforceCentralizedEventsRule from '@test/eslint/enforce-centralized-events-rule.js'

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

describe('enforce-centralized-events', () => {
  it('should pass all valid test cases', () => {
    ruleTester.run('enforce-centralized-events', enforceCentralizedEventsRule, {
      valid: [
        // ========================================
        // Valid: Using centralized utilities
        // ========================================
        {
          code: `
        import { addButtonEventListeners } from '@components/scripts/elementListeners';
        const button = document.querySelector('button');
        addButtonEventListeners(button, handleClick);
      `,
          filename: 'src/components/SomeComponent/index.ts',
        },
        {
          code: `
        import { addLinkEventListeners } from '@components/scripts/elementListeners';
        const link = document.querySelector('a');
        addLinkEventListeners(link, handleClick);
      `,
          filename: 'src/components/SomeComponent/index.ts',
        },
        {
          code: `
        import { addWrapperEventListeners } from '@components/scripts/elementListeners';
        const wrapper = document.querySelector('div');
        addWrapperEventListeners(wrapper, handleEscape);
      `,
          filename: 'src/components/SomeComponent/index.ts',
        },

        // ========================================
        // Valid: Inside the centralized handler file itself
        // ========================================
        {
          code: `
        element.addEventListener('click', clickHandler);
        element.addEventListener('keyup', keyupHandler);
        element.addEventListener('touchend', touchendHandler);
      `,
          filename: 'src/components/scripts/elementListeners/index.ts',
        },

        // ========================================
        // Valid: Non-restricted events
        // ========================================
        {
          code: `
        element.addEventListener('focus', handleFocus);
        element.addEventListener('blur', handleBlur);
        element.addEventListener('scroll', handleScroll);
        element.addEventListener('resize', handleResize);
        element.addEventListener('load', handleLoad);
      `,
          filename: 'src/components/SomeComponent/index.ts',
        },

        // ========================================
        // Valid: Variable event names (can't be checked statically)
        // ========================================
        {
          code: `
        const eventType = 'click';
        element.addEventListener(eventType, handler);
      `,
          filename: 'src/components/SomeComponent/index.ts',
        },

        // ========================================
        // Valid: Document-level listeners (allowed - element utilities don't work here)
        // ========================================
        {
          code: `
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
      `,
          filename: 'src/components/SomeComponent/index.ts',
        },

        // ========================================
        // Valid: Window-level listeners (allowed - element utilities don't work here)
        // ========================================
        {
          code: `
        window.addEventListener('keyup', handleWindowKeyup);
        window.addEventListener('click', handleWindowClick);
      `,
          filename: 'src/components/SomeComponent/index.ts',
        },

        // ========================================
        // Valid: this.addEventListener in web components (component is the event target)
        // ========================================
        {
          code: `
        class MyComponent extends HTMLElement {
          connectedCallback() {
            this.addEventListener('click', this.handleClick);
            this.addEventListener('keyup', this.handleKeyUp);
          }
        }
      `,
          filename: 'src/components/MyComponent/index.ts',
        },

        // ========================================
        // Valid: LitElement web components
        // ========================================
        {
          code: `
        import { LitElement } from 'lit';

        class MyComponent extends LitElement {
          connectedCallback() {
            super.connectedCallback();
            this.addEventListener('click', this.handleClick);
            this.addEventListener('keyup', this.handleKeyUp);
          }
        }
      `,
          filename: 'src/components/MyComponent/index.ts',
        },
      ],

      invalid: [
        // ========================================
        // Invalid: Direct click event listener
        // ========================================
        {
          code: `
        button.addEventListener('click', handleClick);
      `,
          filename: 'src/components/SomeComponent/index.ts',
          errors: [
            {
              messageId: 'useCentralizedUtility',
              data: {
                utility: 'addButtonEventListeners or addLinkEventListeners',
                description: 'click events',
                features: 'click, keyup Enter, and touchend support',
              },
            },
          ],
        },

        // ========================================
        // Invalid: Direct keyup event listener
        // ========================================
        {
          code: `
        button.addEventListener('keyup', handleKeyup);
      `,
          filename: 'src/components/SomeComponent/index.ts',
          errors: [
            {
              messageId: 'useCentralizedUtility',
              data: {
                utility:
                  'addButtonEventListeners, addLinkEventListeners, or addWrapperEventListeners',
                description: 'keyup events (Enter/Escape)',
                features: 'isComposing check, repeat prevention, Enter/Escape key handling',
              },
            },
          ],
        },

        // ========================================
        // Invalid: Direct touchend event listener
        // ========================================
        {
          code: `
        button.addEventListener('touchend', handleTouch);
      `,
          filename: 'src/components/SomeComponent/index.ts',
          errors: [
            {
              messageId: 'useCentralizedUtility',
              data: {
                utility: 'addButtonEventListeners or addLinkEventListeners',
                description: 'touchend events',
                features: 'click, keyup Enter, and touchend support',
              },
            },
          ],
        },

        // ========================================
        // Invalid: keydown instead of keyup
        // ========================================
        {
          code: `
        button.addEventListener('keydown', handleKeydown);
      `,
          filename: 'src/components/SomeComponent/index.ts',
          errors: [
            {
              messageId: 'useCentralizedUtility',
              data: {
                utility: 'keyup with addButtonEventListeners or addWrapperEventListeners',
                description:
                  'keyboard events (use keyup instead of keydown for better accessibility)',
                features: 'isComposing check, repeat prevention, Enter/Escape key handling',
              },
            },
          ],
        },

        // ========================================
        // Invalid: deprecated keypress event
        // ========================================
        {
          code: `
        button.addEventListener('keypress', handleKeypress);
      `,
          filename: 'src/components/SomeComponent/index.ts',
          errors: [
            {
              messageId: 'useCentralizedUtility',
              data: {
                utility: 'keyup with addButtonEventListeners or addWrapperEventListeners',
                description: 'keyboard events (use keyup instead of deprecated keypress)',
                features: 'isComposing check, repeat prevention, Enter/Escape key handling',
              },
            },
          ],
        },

        // ========================================
        // Invalid: Non-web-component button click on child element
        // ========================================
        {
          code: `
        const button = this.querySelector('button');
        button.addEventListener('click', handleClick);
      `,
          filename: 'src/components/SomeComponent/index.ts',
          errors: [
            {
              messageId: 'useCentralizedUtility',
              data: {
                utility: 'addButtonEventListeners or addLinkEventListeners',
                description: 'click events',
                features: 'click, keyup Enter, and touchend support',
              },
            },
          ],
        },
      ],
    })
  })
})
