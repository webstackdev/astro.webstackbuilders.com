/**
 * Mock implementation of focus-trap for testing
 *
 * This mock provides a simplified version of focus-trap that works in jsdom environments
 * where the library's tabbable element detection doesn't work properly.
 *
 * **Reusability:**
 * This mock can be used in any component test that uses focus-trap (modals, dialogs,
 * navigation menus, sidebars, dropdowns, etc.).
 *
 * **Usage in tests:**
 * ```typescript
 * vi.mock('focus-trap', () => {
 *   return {
 *     createFocusTrap: () => ({
 *       activate: vi.fn().mockReturnThis(),
 *       deactivate: vi.fn().mockReturnThis(),
 *       pause: vi.fn().mockReturnThis(),
 *       unpause: vi.fn().mockReturnThis(),
 *       updateContainerElements: vi.fn().mockReturnThis(),
 *       active: false,
 *       paused: false,
 *     }),
 *   }
 * })
 * ```
 *
 * **Note:** When testing focus-trap behavior like ESC key handling, you may need to
 * manually invoke the onDeactivate callback instead of dispatching keyboard events,
 * since the mock doesn't implement the real focus-trap's event handling.
 */
import type { FocusTrap, Options } from 'focus-trap'

/**
 * Creates a mock focus trap for testing
 * @param _element - The element(s) to trap focus within
 * @param _options - Focus trap options
 * @returns A mock FocusTrap object
 */
export function createFocusTrap(
  _element: HTMLElement | HTMLElement[],
  _options?: Options
): FocusTrap {
  const trap: FocusTrap = {
    activate: (): FocusTrap => {
      return trap
    },
    deactivate: (): FocusTrap => {
      return trap
    },
    pause: (): FocusTrap => {
      return trap
    },
    unpause: (): FocusTrap => {
      return trap
    },
    updateContainerElements: (_containerElements: HTMLElement | HTMLElement[]): FocusTrap => {
      return trap
    },
  } as FocusTrap

  return trap
}
