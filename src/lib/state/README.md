# State Management

Unified state management for the application using Nanostores.

## Overview

All client-side state is managed through a centralized store in `src/lib/state/index.ts`. This provides:

- ✅ **Single source of truth** for all application state
- ✅ **Automatic GDPR consent enforcement** via side effects
- ✅ **Reactive updates** when state changes (like Redux subscriptions)
- ✅ **Type-safe** operations with full TypeScript support
- ✅ **Minimal bundle size** (~1KB for Nanostores)

## Architecture

### Data Flow

```
Cookies (Persistent) → Nanostores (Runtime) → Components
         ↓                       ↓
    Source of Truth        Single Store
    (GDPR compliant)      (Reactive state)
```

### State Initialization

On every page load:
1. `AppBootstrap` runs first (`astro:before-preparation` event)
2. Reads consent from cookies → Loads into `$consent` store
3. Sets up side effects (consent change listeners)
4. Other components can now safely read from stores

## Available Stores

### Consent State

```typescript
import { $consent, $hasAnalyticsConsent, updateConsent } from '@lib/state'

// Read current consent
const consent = $consent.get()
console.log(consent.analytics) // false

// Check specific category
const hasAnalytics = $hasAnalyticsConsent.get() // false

// Update consent (automatically updates cookie AND triggers side effects)
updateConsent('analytics', true)

// Subscribe to changes
$hasAnalyticsConsent.subscribe((hasConsent) => {
  if (hasConsent) loadAnalytics()
})
```

### Theme State

```typescript
import { $theme, setTheme } from '@lib/state'

// Read current theme
const currentTheme = $theme.get() // 'default' | 'dark' | 'holiday'

// Update theme (automatically checks consent and persists)
setTheme('dark')

// Subscribe to changes
$theme.subscribe((themeId) => {
  console.log('Theme changed to:', themeId)
})
```

### Mastodon Instances

```typescript
import { $mastodonInstances, saveMastodonInstance } from '@lib/state'

// Read saved instances
const instances = [...$mastodonInstances.get()] // Array of domains

// Save instance (max 5, FIFO, requires functional consent)
saveMastodonInstance('mastodon.social')

// Subscribe to changes
$mastodonInstances.subscribe((instances) => {
  console.log('Instances updated:', [...instances])
})
```

### Embed Cache

```typescript
import { cacheEmbed, getCachedEmbed } from '@lib/state'

// Cache embed data (requires functional consent)
cacheEmbed('twitter_123', embedData, 3600000) // 1 hour TTL

// Retrieve from cache (null if expired or no consent)
const cached = getCachedEmbed('twitter_123')
```

## Actions (State Updaters)

All state mutations go through action functions:

| Action | Purpose | Consent Required |
|--------|---------|------------------|
| `updateConsent(category, value)` | Update consent for category | No (necessary) |
| `allowAllConsent()` | Grant all consent categories | No |
| `revokeAllConsent()` | Revoke all non-necessary consent | No |
| `setTheme(themeId)` | Update theme | Yes (functional) |
| `saveMastodonInstance(domain)` | Save Mastodon instance | Yes (functional) |
| `removeMastodonInstance(domain)` | Remove Mastodon instance | No |
| `cacheEmbed(key, data, ttl)` | Cache embed response | Yes (functional) |
| `getCachedEmbed(key)` | Get cached embed | Yes (functional) |

## Side Effects

Side effects run automatically when state changes (like Redux middleware):

### 1. Consent Change → Script Loading

When consent is granted/revoked, dispatches `consent-changed` event:

```typescript
// Automatically happens when updateConsent() is called
window.dispatchEvent(new CustomEvent('consent-changed', {
  detail: { category: 'analytics', granted: true }
}))
```

The loader system listens for this event and loads/unloads consent-gated scripts.

### 2. Functional Consent Revoked → Clear Storage

When functional consent is revoked, automatically:
- Clears `theme` from localStorage
- Clears `mastodonInstances` from localStorage
- Clears `mastodonCurrentInstance` from localStorage
- Clears embed cache from memory

### 3. Theme Change → Update DOM

When theme changes:
- Updates `data-theme` attribute on `<html>`
- Updates `<meta name="theme-color">` element

### 4. Modal Visibility → Update DOM

When `$cookieModalVisible` changes:
- Shows/hides cookie consent modal

## Cookie Management

Uses `js-cookie` for all cookie operations:

```typescript
import { getCookie, setCookie, removeCookie } from '@lib/state/cookies'

// Get cookie
const value = getCookie('consent_analytics') // 'true' | 'false' | undefined

// Set cookie
setCookie('consent_analytics', 'true', {
  expires: 365,
  sameSite: 'strict'
})

// Remove cookie
removeCookie('consent_analytics')
```

## Component Migration Examples

### Before: Direct localStorage

```typescript
// Old approach (inconsistent, no consent checking)
localStorage.setItem('theme', 'dark')
const theme = localStorage.getItem('theme')
```

### After: Centralized Store

```typescript
// New approach (consistent, automatic consent checking)
import { setTheme, $theme } from '@lib/state'

setTheme('dark') // Automatically checks consent
const theme = $theme.get()
```

### Before: Manual Cookie Parsing

```typescript
// Old approach (manual parsing, error-prone)
const consent = document.cookie
  .split('; ')
  .find(row => row.startsWith('consent_analytics='))
  ?.split('=')[1]
```

### After: Typed Store

```typescript
// New approach (type-safe, reactive)
import { $hasAnalyticsConsent } from '@lib/state'

const hasConsent = $hasAnalyticsConsent.get() // boolean
```

## Testing

Mock stores in tests:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { $consent, updateConsent } from '@lib/state'

describe('MyComponent', () => {
  beforeEach(() => {
    // Reset state before each test
    $consent.set({
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false,
    })
  })

  it('should load when consent granted', () => {
    updateConsent('analytics', true)

    expect($consent.get().analytics).toBe(true)
  })
})
```

## Adding New State

To add new state to the system:

1. **Add store** to `src/lib/state/index.ts`:

```typescript
export const $newFeature = persistentAtom('newFeature', defaultValue)
```

2. **Add action** (if needed):

```typescript
export function updateNewFeature(value: string): void {
  const hasConsent = $consent.get().functional
  if (hasConsent) {
    $newFeature.set(value)
  }
}
```

3. **Add side effect** (if needed) in `initStateSideEffects()`:

```typescript
$newFeature.subscribe((value) => {
  // React to changes
  console.log('Feature updated:', value)
})
```

4. **Use in components**:

```typescript
import { $newFeature, updateNewFeature } from '@lib/state'

const value = $newFeature.get()
updateNewFeature('new value')
```

## Benefits

### Consistency
- ✅ One pattern for all state
- ✅ One import location (`@lib/state`)
- ✅ One way to update state (action functions)

### GDPR Compliance
- ✅ Cookies remain source of truth
- ✅ Automatic consent enforcement
- ✅ Automatic storage clearing on consent revocation
- ✅ Scripts reload when consent changes

### Developer Experience
- ✅ Full TypeScript support
- ✅ IDE autocomplete for all operations
- ✅ Clear action functions (no manual `setItem` calls)
- ✅ Reactive by default (automatic updates)

### Performance
- ✅ Tiny bundle size (1KB)
- ✅ No unnecessary re-renders
- ✅ Efficient change detection
- ✅ No FOUC with theme

## Related Documentation

- [State Management Refactoring Plan](../../../docs/STATE_MANAGEMENT_REFACTOR.md)
- [State Management Analysis](../../components/Scripts/state/STORE.md)
- [GDPR Compliance Plan](../../components/GDPRConsent/GDPR_COMPLIANCE_PLAN.md)
- [Nanostores Documentation](https://github.com/nanostores/nanostores)
