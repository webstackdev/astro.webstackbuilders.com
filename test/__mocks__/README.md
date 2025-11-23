# Shared Test Mocks

This directory contains reusable mock implementations for testing.

## Available Mocks

### `focus-trap.ts`

Mock implementation of the `focus-trap` library for testing in DOM test environments.

**Why this mock is needed:**

- The real `focus-trap` library uses tabbable element detection that doesn't work properly in test environments
- Tests fail with "Your focus-trap must have at least one container with at least one tabbable node" errors
- This mock provides simplified focus-trap behavior that works reliably in test environments

**Usage in component tests:**

```typescript
import { describe, expect, test, vi } from 'vitest'

// Mock focus-trap at the top of your test file
vi.mock('focus-trap', () => {
  return {
    createFocusTrap: () => ({
      activate: vi.fn().mockReturnThis(),
      deactivate: vi.fn().mockReturnThis(),
      pause: vi.fn().mockReturnThis(),
      unpause: vi.fn().mockReturnThis(),
      updateContainerElements: vi.fn().mockReturnThis(),
      active: false,
      paused: false,
    }),
  }
})

// Your tests here...
test('my focus trap test', () => {
  // Test code that uses focus-trap
})
```

**Components that may need this mock:**

- Navigation menus with focus trapping
- Modal dialogs
- Dropdown menus
- Sidebars
- Any component using `createFocusTrap()` from the `focus-trap` package

**Important notes:**

- The mock doesn't implement real keyboard event handling (ESC key, etc.)
- If testing focus-trap callbacks (like `onDeactivate`), call them manually in tests
- See `src/components/Navigation/__tests__/navigation.spec.ts` for example usage

## Adding New Mocks

When adding new shared mocks:

1. Create the mock file in this directory
2. Export the mock implementation matching the library's API
3. Add comprehensive JSDoc comments explaining:
   - Why the mock is needed
   - How to use it in tests
   - Any limitations or special considerations
4. Document it in this README
5. Include usage examples

## Best Practices

- Keep mocks as simple as possible while satisfying test requirements
- Match the original library's TypeScript types when possible
- Document any deviations from real library behavior
- Share mocks across components to reduce duplication
