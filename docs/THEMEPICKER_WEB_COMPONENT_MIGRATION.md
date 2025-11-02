# ThemePicker Migration to Web Component

## Summary
Successfully migrated ThemePicker from the LoadableScript pattern to a native Web Component (Custom Element) architecture. This migration follows Astro's best practices and eliminates the need for complex script loading infrastructure.

## What Changed

### Files Created
- `src/components/ThemePicker/theme-picker-element.ts` - New Web Component implementation

### Files Modified
- `src/components/ThemePicker/Themes.astro` - Updated to use `<theme-picker>` custom element wrapper
- `src/components/ThemePicker/ThemeButton.astro` - Added `data-theme-toggle` attribute
- `src/components/ThemePicker/index.astro` - Simplified to remove unnecessary wrapper
- `test/e2e/specs/11-regression/theme-picker-view-transitions.spec.ts` - Updated comments to reference new implementation

### Files Removed
- `src/components/ThemePicker/client.ts` - Old LoadableScript-based implementation
- `src/components/ThemePicker/selectors.ts` - Old DOM selector utilities (replaced with data attributes)

## Architecture Changes

### Before: LoadableScript Pattern
```typescript
export class ThemePicker extends LoadableScript {
  static override scriptName = 'ThemePicker'
  static override eventType: TriggerEvent = 'astro:page-load'
  // Complex initialization with queuing and lifecycle management
}
```

**Issues:**
- Over-engineered for simple components
- Fought against Astro's native capabilities
- Required complex loader infrastructure
- Inconsistent lifecycle with View Transitions

### After: Web Component Pattern
```typescript
export class ThemePickerElement extends HTMLElement {
  connectedCallback(): void {
    // Auto-runs when element is added to DOM
    this.findElements()
    this.bindEvents()
  }

  disconnectedCallback(): void {
    // Auto-cleanup when removed
  }
}
```

**Benefits:**
- Native browser API
- Automatic lifecycle management
- Works seamlessly with View Transitions
- Scoped to component instance
- No external loader needed

## Key Features Implemented

### 1. Modal Management
- Open/close on toggle button click
- Close on Escape key
- Close on click outside modal
- Proper ARIA attributes (`aria-expanded`, `aria-checked`)

### 2. Theme Selection
- Visual feedback with `is-active` class on `<li>` parent
- Theme persistence using nanostores (`$theme`)
- System preference detection (`prefers-color-scheme`)
- Meta theme-color updates

### 3. Data Attribute Scoping
- `[data-theme-toggle]` - Toggle button
- `[data-theme-modal]` - Modal wrapper
- `[data-theme-close]` - Close button
- `[data-theme]` - Theme selection buttons

### 4. View Transitions Compatibility
- Web Component lifecycle automatically handles page transitions
- No manual re-initialization needed
- State persists via `transition:persist` on parent component

## Testing

### Test Results
- ✅ 8/8 ThemePicker tests passing
- ✅ New Web Component tests created and passing
- ✅ All regression tests passing
- ✅ View Transitions navigation tests passing

### New Test File
`test/e2e/specs/04-components/theme-picker-web-component.spec.ts`
- Theme picker modal opens and closes
- Can select themes
- Uses `setupTestPage()` for proper cookie modal handling

### Updated Tests
- All regression tests now use `setupTestPage()` helper
- Tests verify active class on `<li>` parent elements
- Tests verify click-outside-to-close functionality

## Next Steps

This migration proves the Web Component pattern works well for Astro components. The same approach can be applied to:

1. **Navigation Component** - Singleton mobile menu management
2. **Carousel Component** - Multi-instance slideshow management
3. **ContactForm Component** - Form validation and submission
4. **CookieConsent Component** - Modal and consent tracking

Once all components are migrated, the entire `src/components/Scripts/loader/` system can be removed.

## References

- [Astro Client-Side Scripts](https://docs.astro.build/en/guides/client-side-scripts/)
- [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements API](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
