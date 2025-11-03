# Theme System - Work in Progress

## Current Status

### What's Working
- ✅ Theme picker tests: 9/10 @ready (63 tests passing across 7 browsers)
- ✅ Manual theme selection and persistence works correctly
- ✅ Theme switching via theme picker UI works
- ✅ View Transitions correctly maintain theme across page navigations
- ✅ CSS architecture refactored: `@theme inline` uses `var()` references instead of hard-coded values

### What's Broken
- ❌ **System preference (prefers-color-scheme) not respected on first visit in real browser**
  - Test passes but real usage fails
  - Opening site in new incognito window with dark mode preference shows light theme
  - Google.com correctly shows dark, but our site doesn't

- ❌ **Theme picker buttons should show their own theme's colors**
  - Dark theme button should use `--dark-color-*` variables
  - Default theme button should use `--light-color-*` variables
  - Currently all buttons use light theme colors (partially fixed but needs completion)

## Root Cause Analysis

### System Preference Issue

The problem is a **race condition** between:
1. HEAD inline script (synchronous) - correctly sets `data-theme="dark"` based on `prefers-color-scheme`
2. `persistentAtom` restore (asynchronous) - overwrites theme back to 'default'

**Sequence of events:**
```
1. HEAD script runs → checks localStorage (empty) → checks prefersDark=true → sets data-theme="dark" ✓
2. persistentAtom initializes with default value 'default'
3. Our init code runs with setTimeout(100ms)
4. persistentAtom's restore() completes (async) → fires .listen() → overwrites to 'default' ✗
```

**Current fix attempt:**
- Using `isInitialized` flag to prevent `.listen()` from applying themes until init completes
- Using `setTimeout(100ms)` to delay init until after `persistentAtom.restore()` completes
- **Problem:** The timing is unreliable - 100ms might not be enough on slower devices

**Test vs Reality:**
- Playwright test passes because it's using `emulateMedia({ colorScheme: 'dark' })`
- Real browser behavior is different - the race condition manifests differently
- Test needs to be improved to catch this real-world bug

## Files Modified

### Theme Initialization
- `src/components/Scripts/state/store/themes.ts` (lines 127-180)
  - Changed from `.subscribe()` to `.listen()` to avoid immediate firing
  - Added `isInitialized` flag to gate theme applications
  - Added `setTimeout(100)` to wait for `persistentAtom.restore()`
  - **HAS DEBUG LOGGING** - needs to be removed before commit

### Theme Picker UI
- `src/components/ThemePicker/Themes.astro` (lines 97-120)
  - **NOT YET FIXED** - still needs to map theme.id to color prefix
  - Should use `--${colorPrefix}-color-*` variables per button

### HEAD Script
- `src/components/Head/index.astro` (lines 56-63)
  - Correctly checks `prefers-color-scheme` and sets `data-theme`
  - Logic: stored theme (if not 'default') > system preference > 'default'

### CSS Architecture
- `src/styles/themes.css`
  - ✅ Lines 65-105: `@theme inline` refactored to use `var()` references
  - ✅ All theme-specific colors defined at `:root` level
  - Has `--light-color-*`, `--dark-color-*`, and base `--color-*` variables

## Next Steps

### High Priority
1. **Fix system preference detection**
   - Option A: Find more reliable way to detect when `persistentAtom.restore()` completes
   - Option B: Use `MutationObserver` to watch for theme changes from restore
   - Option C: Initialize theme BEFORE importing `persistentAtom`
   - Option D: Use regular `atom` for store, manually sync to localStorage after restore completes
   - Option E: Don't rely on setTimeout - use `requestIdleCallback` or similar

2. **Fix theme picker button colors**
   - Complete the Themes.astro fix to show each theme's own colors
   - Map `theme.id` to color variable prefix: 'default' → 'light', 'dark' → 'dark'
   - Update color swatches to use theme-specific variables

3. **Remove debug logging**
   - `src/components/Scripts/state/store/themes.ts` has console.log statements
   - Clean these up before final commit

### Test Improvements
4. **Make test match real browser behavior**
   - Current test uses `emulateMedia()` which might not trigger same race condition
   - Consider testing with actual localStorage clearing and page reload
   - Add test that validates theme immediately on page load (before JS runs)

## Technical Constraints

- **MUST use `persistentAtom`** - required for View Transitions to maintain theme across navigations
- **CANNOT use regular `atom`** - will lose persistence across page navigations
- HEAD script must run synchronously to prevent FOUC (Flash of Unstyled Content)
- Theme must be applied before page renders (critical for UX)

## Code Locations

- Theme store: `src/components/Scripts/state/store/themes.ts`
- Theme picker UI: `src/components/ThemePicker/Themes.astro`
- Theme picker element: `src/components/ThemePicker/theme-picker-element.ts`
- HEAD script: `src/components/Head/index.astro` (lines 56-63)
- CSS themes: `src/styles/themes.css`
- E2E tests: `test/e2e/specs/04-components/theme-picker.spec.ts` (line 134 is failing test)

## Questions to Answer

1. When exactly does `persistentAtom.restore()` complete?
2. Is there an event or promise we can wait for?
3. Should we implement our own localStorage persistence instead of using `persistentAtom`?
4. Can we leverage the `@media (prefers-color-scheme: dark)` CSS to avoid needing JS for system preference?

## Useful Context

- The `@media (prefers-color-scheme: dark)` CSS rule at lines 337-373 in themes.css correctly applies dark theme
- This CSS works WITHOUT JavaScript
- The issue is the JS is overriding this CSS by setting `data-theme="default"`
- Maybe we should NOT set `data-theme` at all when using system preference?
