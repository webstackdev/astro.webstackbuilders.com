# E2E Tests to Implement

## Event Conflict Analysis

### ⚠️ CONFLICT IDENTIFIED: `touchend` Event

**Issue**: Both systems use the `touchend` event:

1. **DelayedLoader**: Listens for `touchend` as a user interaction trigger
   - Location: `src/lib/utils/delayedLoader.ts`
   - Purpose: Detect user interaction to execute delayed scripts
   - Events: `'keydown' | 'mousemove' | 'wheel' | 'touchmove' | 'touchstart' | 'touchend'`

2. **ElementListeners (ThemePicker)**: Uses `touchend` for button interactions
   - Location: `src/lib/utils/elementListeners.ts` (lines 51, 57)
   - Purpose: Handle button clicks on touch devices
   - Used by: ThemePicker buttons via `addButtonEventListeners()`

### Conflict Details

- **ThemePicker Setup**: Uses `addButtonEventListeners()` which attaches `touchend` listeners to theme buttons
- **DelayedLoader**: Also listens for `touchend` events globally to trigger script execution
- **Potential Issue**: When a user touches a theme picker button:
  1. DelayedLoader's `touchend` listener triggers first (if scripts haven't executed yet)
  2. This executes all delayed scripts including ThemePicker initialization
  3. ThemePicker's `touchend` handler also fires
  4. Could cause race conditions or double initialization

### Current Status

- **Risk Level**: Low to Medium
- **Impact**: Potential race conditions, but both systems use `{ once: true }` options
- **Mitigation**: DelayedLoader uses singleton pattern to prevent double execution

### Recommendations

1. **Monitor**: Watch for any unusual behavior with theme picker interactions on touch devices
2. **Consider**: Modifying elementListeners to check if delayedLoader has executed before attaching listeners
3. **Alternative**: Use different events or implement coordination between the systems if issues arise
