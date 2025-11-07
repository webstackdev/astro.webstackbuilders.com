# ThemePicker Mobile Issues

## Current Status: UNRESOLVED

Date: November 8, 2025
Component: `src/components/ThemePicker/client.ts`

## Symptoms

### Issue 1: First Tap Causes Modal to Flash Open/Closed

- **When**: First touch of the toggle button after page load
- **Behavior**: Theme picker modal briefly opens then immediately closes
- **Expected**: Modal should stay open on first tap

### Issue 2: Second Tap Opens but Cannot Close

- **When**: Second touch of the toggle button
- **Behavior**: Modal opens successfully
- **Expected**: This is correct behavior

### Issue 3: Toggle Button Non-Functional After Opening

- **When**: Tapping toggle button after modal is open
- **Behavior**: No effect - modal stays open, cannot close via toggle
- **Expected**: Toggle button should close the modal

## Root Cause Analysis

### Event Flow on Mobile (from Chrome DevTools debugging)

```bash
[1762548393148] touchstart reached document {from: 'svg', propagationStopped: false, modalOpen: false}
[1762548393148] touchstart on toggleBtn {propagationStopped: false, modalOpen: false}
[1762548393273] touchend reached document {from: 'svg', propagationStopped: false, modalOpen: false}
[1762548393273] touchend on toggleBtn {propagationStopped: false, modalOpen: false}
[1762548393276] click reached document {from: 'svg', propagationStopped: false, modalOpen: false}
[1762548393276] click on toggleBtn {propagationStopped: false, modalOpen: false}

Modal state after tap: {hidden: true, isOpen: true}
```

### Key Findings

1. **Event target is SVG, not button**: User taps the icon SVG element inside the button
2. **Document listener runs BEFORE button handler**: Events reach document in capture phase before button handlers
3. **stopPropagation() never called**: All events show `propagationStopped: false`
4. **Contradictory state**: Modal has `hidden: true` AND `isOpen: true` class simultaneously
5. **State not updating synchronously**: `modalOpen: false` persists even after toggle should open it

### Technical Details

- **Component**: LitElement-based Web Component with Light DOM
- **Event handling**: Uses `addButtonEventListeners()` helper which adds `click`, `keyup`, and `touchend` listeners
- **State management**: Nanostores `$themePickerOpen` persistentAtom
- **Document listeners**: Added in bubble phase (default) for "click outside to close" functionality

## Attempted Fixes (All Failed)

### Attempt 1: Event Propagation Control

**Approach**: Add `e.stopPropagation()` to toggle button handler

```typescript
addButtonEventListeners(this.toggleBtn, (e) => {
  e.stopPropagation()
  this.handleToggle()
}, this)
```

**Result**: Failed - `stopPropagation()` never called (events show `propagationStopped: false`)

### Attempt 2: Capture Phase on Document Listener

**Approach**: Use capture phase `addEventListener(..., true)` to run document listener first
**Result**: Failed - Made problem worse, document listener saw old state

### Attempt 3: Bubble Phase + stopPropagation

**Approach**: Use default bubble phase, rely on button's `stopPropagation()`
**Result**: Failed - Button handler's `stopPropagation()` not executing

### Attempt 4: Timestamp-Based Debounce (50ms)

**Approach**: Track `justToggledTimestamp`, skip document listeners within 50ms

```typescript
private justToggledTimestamp = 0
// In handleToggle:
this.justToggledTimestamp = Date.now()
// In document listeners:
if (Date.now() - this.justToggledTimestamp < 50) return
```

**Result**: Failed - 50ms too short for event sequence

### Attempt 5: Increased Debounce (150ms)

**Approach**: Increased timeout to 150ms
**Result**: Failed - Still not enough time

### Attempt 6: Pointer Events Blocking

**Approach**: Set `document.body.style.pointerEvents = 'none'` for 100ms when opening

```typescript
document.body.style.pointerEvents = 'none'
this.pickerModal.style.pointerEvents = 'auto'
this.toggleBtn.style.pointerEvents = 'auto'
setTimeout(() => {
  document.body.style.pointerEvents = ''
  // ...
}, 100)
```

**Result**: Failed - Blocked toggle button itself on subsequent taps (couldn't close modal)
**Evidence**: Console showed `body pointerEvents: none` but button still blocked

### Attempt 7: Boolean Flag (isTogglingViaButton)

**Approach**: Set flag during toggle, document listeners skip if flag is true

```typescript
private isTogglingViaButton = false
// In handleToggle:
this.isTogglingViaButton = true
setTimeout(() => { this.isTogglingViaButton = false }, 200)
// In document listeners:
if (this.isTogglingViaButton) return
```

**Result**: Failed - Same behavior persists

## Desktop Behavior

**Status**: ✅ WORKING CORRECTLY

The desktop (mouse) implementation works perfectly:

- First click opens modal
- Second click on toggle closes modal
- Click outside closes modal
- Modal persists correctly across View Transitions navigation

## Proposed Solutions (Not Yet Attempted)

### Option A: Remove Document Listeners, Use Backdrop Element

Instead of document-level click listeners, add a transparent backdrop element:

```html
<div class="themepicker-backdrop" hidden></div>
```

- Show backdrop when modal opens
- Click on backdrop closes modal
- Backdrop is a sibling of modal, easier to control event flow

### Option B: Use requestAnimationFrame for State Sync

Delay document listener checks until next animation frame to ensure state updates:

```typescript
requestAnimationFrame(() => {
  // Check state here after it's guaranteed to update
})
```

### Option C: Completely Remove "Click Outside to Close"

Simplify mobile UX - require explicit close button tap or theme selection to close modal

### Option D: Mobile-Specific Event Handling

Detect mobile and use completely different event handling:

```typescript
const isMobile = 'ontouchstart' in window
if (isMobile) {
  // Use touchstart/touchend only, different logic
} else {
  // Use click events
}
```

### Option E: Use focus-trap Library

Implement proper focus management to handle modal open/close, which includes backdrop click handling

## Related Files

- `src/components/ThemePicker/client.ts` - Main component logic
- `src/components/ThemePicker/index.astro` - Template (Light DOM)
- `src/components/ThemePicker/selectors.ts` - DOM query helpers
- `src/components/scripts/store/themes.ts` - State management (`$themePickerOpen`)
- `src/components/scripts/elementListeners/index.ts` - `addButtonEventListeners` helper

## Desktop Fix Applied (Working)

### View Transitions Scroll Jump Fix

**Issue**: When modal was open and user navigated to new page, content would scroll down
**Solution**: Apply modal state immediately after DOM swap in `astro:after-swap` handler

```typescript
document.addEventListener('astro:after-swap', () => {
  this.findElements()

  const isOpen = this.themePickerOpenStore.value
  if (isOpen) {
    // Apply state synchronously before browser paints
    this.pickerModal.removeAttribute('hidden')
    this.pickerModal.classList.add(CLASSES.isOpen)
    this.toggleBtn.setAttribute('aria-expanded', 'true')
  }

  this.requestUpdate()
})
```

**Result**: ✅ WORKING - Content no longer jumps on navigation

## Next Steps

1. Implement Option A (backdrop element) - most likely to succeed
2. If Option A fails, try Option D (mobile-specific handling)
3. Consider if "click outside to close" is necessary UX on mobile
4. Add comprehensive unit tests to catch regressions

## Notes for Future Developer

- The `addButtonEventListeners` helper wraps handlers but DOES pass the event object
- The SVG icon inside the button is the actual event target, not the button itself
- `toggleBtn.contains(target)` should catch SVG clicks but doesn't prevent issues
- Nanostores updates may not be synchronous enough for rapid event sequences
- Mobile touch events fire in sequence: touchstart → touchend → click (with ~3ms delay)
