# State Management Refactoring Plan

**Date**: October 19, 2025
**Objective**: Create a consistent, unified state management architecture across all components with automatic consent-gated script reloading.

---

## Current Problems

### 1. Inconsistent State Patterns

| Component | Pattern | Library | Issue |
|-----------|---------|---------|-------|
| **ThemePicker** | Direct localStorage | None | Manual `getItem/setItem` calls |
| **Mastodon** | Reactive atoms | `@nanostores/persistent` | Only component using Nanostores |
| **Cookie Modal** | Custom functions | None | Manual `JSON.parse/stringify` |
| **Cookies/Consent** | Direct `document.cookie` | None | Manual cookie parsing |
| **Social/Embed** | Direct localStorage with caching | None | Manual TTL logic |

### 2. No Consent Change Reactivity

**Critical Gap**: When a user changes consent preferences, there's no mechanism to:
- Reload consent-gated scripts that are now allowed
- Unload scripts that are no longer allowed
- Clear localStorage for revoked consent categories
- Update UI components that depend on consent state

### 3. No Single Source of Truth

**Problem**: State is scattered across:
- `localStorage` keys (5 different keys)
- `document.cookie` (5+ cookies)
- In-memory class properties
- Window globals (`window.metaColors`)

**Result**: Hard to know what state exists, where it lives, or how to access it.

---

## Solution: Unified Nanostores Architecture

### Why Nanostores?

✅ **Already in project** (`nanostores` + `@nanostores/persistent`)
✅ **Tiny**: 334 bytes (vs Redux 45KB)
✅ **Framework-agnostic**: Works with Astro's architecture
✅ **Reactive**: Built-in subscriptions (like Redux's `createAsyncThunk`)
✅ **TypeScript-first**: Excellent type inference
✅ **Persistent**: `@nanostores/persistent` handles localStorage automatically

### Nanostores Has Async Side Effects!

**Answer to your question**: Yes! Nanostores has `.listen()` and `.subscribe()` that work like RTK's `createAsyncThunk`:

```typescript
import { atom } from 'nanostores'

export const $consent = atom({ analytics: false })

// Like RTK's createAsyncThunk - runs on every state change!
$consent.subscribe((newConsent) => {
  // Reload scripts when consent granted
  if (newConsent.analytics) {
    loadAnalyticsScripts()
  } else {
    unloadAnalyticsScripts()
  }
})
```

**Better**: Nanostores has computed atoms (derived state) like Redux selectors:

```typescript
import { computed } from 'nanostores'

export const $hasAnalyticsConsent = computed($consent, (consent) => {
  return consent.analytics === true
})

// Auto-updates when $consent changes!
$hasAnalyticsConsent.subscribe((hasConsent) => {
  if (hasConsent) loader.loadConsentGatedScripts('analytics')
})
```

---

## Architecture Design

### Core Principle: **Cookie → Store → Components**

```
┌─────────────────────────────────────────────────┐
│  Cookies (Source of Truth for Persistence)     │
│  - consent_necessary                            │
│  - consent_analytics                            │
│  - consent_functional                           │
│  - consent_advertising                          │
└─────────────┬───────────────────────────────────┘
              │
              │ js-cookie reads on init
              ▼
┌─────────────────────────────────────────────────┐
│  Nanostores (Single Source of Truth at Runtime)│
│  - $consent (Map)                               │
│  - $theme (PersistentAtom)                      │
│  - $mastodonInstances (PersistentAtom)          │
│  - $embedCache (Map)                            │
│  - $cookieModalVisible (Atom)                   │
└─────────────┬───────────────────────────────────┘
              │
              │ .subscribe() triggers side effects
              ▼
┌─────────────────────────────────────────────────┐
│  Side Effects (Automatic on State Change)      │
│  - Update cookies via js-cookie                 │
│  - Reload/unload consent-gated scripts          │
│  - Clear localStorage for revoked consent       │
│  - Update DOM (theme, UI state)                 │
└─────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Install Dependencies

```bash
npm install js-cookie
npm install --save-dev @types/js-cookie
```

#### 1.2 Create Central Store Module

**File**: `src/lib/state/index.ts`

```typescript
/**
 * Central State Management
 * Single source of truth for all client-side state
 */
import { atom, map, computed } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import Cookies from 'js-cookie'

// ============================================================================
// TYPES
// ============================================================================

export type ConsentCategory = 'necessary' | 'analytics' | 'advertising' | 'functional'
export type ConsentValue = boolean
export type ThemeId = 'default' | 'dark' | 'holiday'

export interface ConsentState {
  necessary: ConsentValue
  analytics: ConsentValue
  advertising: ConsentValue
  functional: ConsentValue
  timestamp?: string
}

export interface EmbedCacheEntry {
  data: unknown
  timestamp: number
  ttl: number
}

export interface EmbedCacheState {
  [key: string]: EmbedCacheEntry
}

// ============================================================================
// STORES (Single Source of Truth)
// ============================================================================

/**
 * Consent preferences
 * Source of truth: Cookies (necessary for GDPR compliance)
 * Store updates when cookies change
 */
export const $consent = map<ConsentState>({
  necessary: true,
  analytics: false,
  advertising: false,
  functional: false,
})

/**
 * Theme preference
 * Persisted to localStorage automatically via @nanostores/persistent
 * Requires functional consent to persist
 */
export const $theme = persistentAtom<ThemeId>('theme', 'default', {
  encode: JSON.stringify,
  decode: JSON.parse,
})

/**
 * Cookie consent modal visibility
 * Session-only state (not persisted)
 */
export const $cookieModalVisible = atom<boolean>(false)

/**
 * Mastodon instances
 * Persisted to localStorage automatically
 * Requires functional consent to persist
 */
export const $mastodonInstances = persistentAtom<Set<string>>(
  'mastodonInstances',
  new Set(),
  {
    encode: (set: Set<string>) => JSON.stringify([...set]),
    decode: (value: string) => new Set(JSON.parse(value) as string[]),
  }
)

/**
 * Current Mastodon instance
 * Persisted to localStorage automatically
 * Requires functional consent to persist
 */
export const $currentMastodonInstance = persistentAtom<string | undefined>(
  'mastodonCurrentInstance',
  undefined
)

/**
 * Social embed cache
 * Session-only (not persisted to localStorage)
 * Requires functional consent to use
 */
export const $embedCache = map<EmbedCacheState>({})

// ============================================================================
// COMPUTED STORES (Derived State - like Redux selectors)
// ============================================================================

/**
 * Check if specific consent category is granted
 */
export const $hasAnalyticsConsent = computed($consent, (consent) => consent.analytics)
export const $hasFunctionalConsent = computed($consent, (consent) => consent.functional)
export const $hasAdvertisingConsent = computed($consent, (consent) => consent.advertising)

/**
 * Check if any non-necessary consent is granted
 */
export const $hasAnyConsent = computed($consent, (consent) => {
  return consent.analytics || consent.functional || consent.advertising
})

// ============================================================================
// ACTIONS (State Updaters)
// ============================================================================

/**
 * Initialize consent state from cookies on page load
 * Called once during app initialization
 */
export function initConsentFromCookies(): void {
  const consent: ConsentState = {
    necessary: true, // Always true
    analytics: Cookies.get('consent_analytics') === 'true',
    advertising: Cookies.get('consent_advertising') === 'true',
    functional: Cookies.get('consent_functional') === 'true',
  }

  $consent.set(consent)
}

/**
 * Update consent for specific category
 * Automatically updates both store AND cookie
 */
export function updateConsent(category: ConsentCategory, value: ConsentValue): void {
  // Update store
  $consent.setKey(category, value)

  // Update cookie
  const cookieName = `consent_${category}`
  if (value) {
    Cookies.set(cookieName, 'true', { expires: 365, sameSite: 'strict' })
  } else {
    Cookies.set(cookieName, 'false', { expires: 365, sameSite: 'strict' })
  }

  // Add timestamp
  $consent.setKey('timestamp', new Date().toISOString())
}

/**
 * Grant all consent categories
 */
export function allowAllConsent(): void {
  const categories: ConsentCategory[] = ['necessary', 'analytics', 'advertising', 'functional']
  categories.forEach((category) => updateConsent(category, true))
}

/**
 * Revoke all non-necessary consent
 */
export function revokeAllConsent(): void {
  updateConsent('analytics', false)
  updateConsent('advertising', false)
  updateConsent('functional', false)
}

/**
 * Update theme
 * Automatically persisted to localStorage by persistentAtom
 * Only persists if functional consent is granted
 */
export function setTheme(themeId: ThemeId): void {
  const hasFunctionalConsent = $consent.get().functional

  if (hasFunctionalConsent) {
    $theme.set(themeId)
  } else {
    // Session-only: update DOM but don't persist
    document.documentElement.setAttribute('data-theme', themeId)
  }
}

/**
 * Add Mastodon instance (max 5, FIFO)
 */
export function saveMastodonInstance(domain: string): void {
  const hasFunctionalConsent = $consent.get().functional
  if (!hasFunctionalConsent) return

  const instances = $mastodonInstances.get()
  const updated = new Set([domain, ...instances].slice(0, 5))
  $mastodonInstances.set(updated)
}

/**
 * Remove Mastodon instance
 */
export function removeMastodonInstance(domain: string): void {
  const instances = $mastodonInstances.get()
  instances.delete(domain)
  $mastodonInstances.set(new Set(instances))
}

/**
 * Clear all Mastodon instances
 */
export function clearMastodonInstances(): void {
  $mastodonInstances.set(new Set())
}

/**
 * Add embed to cache
 */
export function cacheEmbed(key: string, data: unknown, ttl: number): void {
  const hasFunctionalConsent = $consent.get().functional
  if (!hasFunctionalConsent) return

  $embedCache.setKey(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Get embed from cache (returns null if expired or missing)
 */
export function getCachedEmbed(key: string): unknown | null {
  const hasFunctionalConsent = $consent.get().functional
  if (!hasFunctionalConsent) return null

  const entry = $embedCache.get()[key]
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    // Expired - remove from cache
    const cache = { ...$embedCache.get() }
    delete cache[key]
    $embedCache.set(cache)
    return null
  }

  return entry.data
}

/**
 * Clear embed cache
 */
export function clearEmbedCache(): void {
  $embedCache.set({})
}

// ============================================================================
// SIDE EFFECTS (Automatic reactions to state changes)
// ============================================================================

/**
 * Setup side effects - call once during app initialization
 * This is like Redux middleware or RTK's createAsyncThunk
 */
export function initStateSideEffects(): void {
  // Side Effect 1: Clear localStorage when functional consent is revoked
  $hasFunctionalConsent.subscribe((hasConsent) => {
    if (!hasConsent) {
      // Clear theme from localStorage
      localStorage.removeItem('theme')

      // Clear Mastodon instances from localStorage
      localStorage.removeItem('mastodonInstances')
      localStorage.removeItem('mastodonCurrentInstance')

      // Clear embed cache
      clearEmbedCache()
    }
  })

  // Side Effect 2: Reload consent-gated scripts when consent changes
  $hasAnalyticsConsent.subscribe((hasConsent) => {
    if (hasConsent) {
      // Trigger loader to load analytics scripts
      window.dispatchEvent(new CustomEvent('consent-changed', {
        detail: { category: 'analytics', granted: true }
      }))
    } else {
      // Unload analytics scripts
      window.dispatchEvent(new CustomEvent('consent-changed', {
        detail: { category: 'analytics', granted: false }
      }))
    }
  })

  // Side Effect 3: Update DOM when theme changes
  $theme.subscribe((themeId) => {
    document.documentElement.setAttribute('data-theme', themeId)

    // Update meta theme-color
    const metaElement = document.querySelector('meta[name="theme-color"]')
    if (metaElement && window.metaColors) {
      metaElement.setAttribute('content', window.metaColors[themeId] || '')
    }
  })

  // Side Effect 4: Show/hide cookie modal
  $cookieModalVisible.subscribe((visible) => {
    const modal = document.getElementById('cookie-consent-modal-id')
    if (modal) {
      modal.style.display = visible ? 'flex' : 'none'
    }
  })
}
```

---

### Phase 2: Cookie Utilities with js-cookie (Week 1)

#### 2.1 Replace `Scripts/state/utility.ts`

**File**: `src/lib/state/cookies.ts`

```typescript
/**
 * Cookie utilities using js-cookie
 * Replaces manual cookie parsing in Scripts/state/utility.ts
 */
import Cookies from 'js-cookie'

export interface CookieOptions {
  expires?: number | Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

/**
 * Get cookie value
 */
export function getCookie(name: string): string | undefined {
  return Cookies.get(name)
}

/**
 * Set cookie value
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const defaults: CookieOptions = {
    expires: 180, // 180 days default
    sameSite: 'strict',
    path: '/',
  }

  Cookies.set(name, value, { ...defaults, ...options })
}

/**
 * Remove cookie
 */
export function removeCookie(name: string): void {
  Cookies.remove(name)
}

/**
 * Get all cookies as object
 */
export function getAllCookies(): { [key: string]: string } {
  return Cookies.get()
}

/**
 * Check if cookie exists
 */
export function hasCookie(name: string): boolean {
  return Cookies.get(name) !== undefined
}
```

---

### Phase 3: Loader Integration (Week 2)

#### 3.1 Update Loader to Listen for Consent Changes

**File**: `src/components/Scripts/loader/index.ts` (modifications)

```typescript
import { $hasAnalyticsConsent, $hasFunctionalConsent, $hasAdvertisingConsent } from '@lib/state'

class Loader {
  // ... existing code ...

  /**
   * Initialize consent-gated script execution
   * Now listens for consent changes and reloads scripts automatically
   */
  private initializeConsentGatedExecution(script: typeof LoadableScript): void {
    const category = script.meta?.consentCategory

    if (!category) {
      console.warn(`Consent-gated script ${script.scriptName} missing consentCategory in meta`)
      return
    }

    // Get appropriate consent store
    const consentStore = this.getConsentStore(category)

    // Subscribe to consent changes - runs when consent is granted!
    const unsubscribe = consentStore.subscribe((hasConsent) => {
      if (hasConsent) {
        console.log(`Consent granted for ${category}, loading ${script.scriptName}`)
        this.execute(script)
      } else {
        console.log(`Consent revoked for ${category}, unloading ${script.scriptName}`)
        this.pause(script)
      }
    })

    // Store unsubscribe function for cleanup
    this.consentUnsubscribers.set(script.scriptName, unsubscribe)
  }

  private getConsentStore(category: string) {
    switch (category) {
      case 'analytics':
        return $hasAnalyticsConsent
      case 'functional':
        return $hasFunctionalConsent
      case 'advertising':
        return $hasAdvertisingConsent
      default:
        throw new Error(`Unknown consent category: ${category}`)
    }
  }

  // Store unsubscribe functions for cleanup
  private consentUnsubscribers = new Map<string, () => void>()

  /**
   * Cleanup subscriptions
   */
  public destroy(): void {
    this.consentUnsubscribers.forEach((unsubscribe) => unsubscribe())
    this.consentUnsubscribers.clear()
  }
}
```

---

### Phase 4: Component Refactoring (Week 2-3)

#### 4.1 ThemePicker

**Before** (`ThemePicker/client.ts`):
```typescript
localStorage.setItem(THEME_STORAGE_KEY, themeId)
```

**After**:
```typescript
import { setTheme } from '@lib/state'

private setTheme(themeId: ThemeIds): void {
  // Update store - automatically handles consent checking and persistence
  setTheme(themeId)

  // Update UI
  this.setActiveItem()
  this.updateMetaThemeColor(themeId)
}
```

#### 4.2 Cookie Consent

**Before** (`Cookies/Consent/cookies.ts`):
```typescript
export const setConsentCookie = (name: Categories, preference: Preference = 'granted') => {
  setCookie(prefixConsentCookie(name), preference)
}
```

**After**:
```typescript
import { updateConsent } from '@lib/state'

export const setConsentCookie = (name: Categories, granted: boolean) => {
  // Update store - automatically updates cookie AND triggers side effects
  updateConsent(name, granted)
}
```

#### 4.3 Cookie Customize

**Before** (`Cookies/Customize/client.ts`):
```typescript
savePreferences(): void {
  const preferences = this.getCurrentPreferences()
  this.setCookie(this.consentCookie, JSON.stringify(preferences), 365)
  this.applyPreferences(preferences)
}
```

**After**:
```typescript
import { updateConsent } from '@lib/state'

savePreferences(): void {
  const preferences = this.getCurrentPreferences()

  // Update store - automatically updates cookies AND reloads scripts
  updateConsent('analytics', preferences.analytics)
  updateConsent('functional', preferences.functional)
  updateConsent('advertising', preferences.advertising)

  // Show confirmation
  this.showNotification('Preferences saved!')

  // No need to manually applyPreferences - side effects handle it!
}
```

#### 4.4 Mastodon Store

**Before** (`Social/Mastodon/store.ts`):
```typescript
export const $savedInstances = persistentAtom<Set<string>>(LOCAL_STORAGE_KEY, new Set(), {
  encode: (set: Set<string>) => JSON.stringify([...set]),
  decode: (value: string) => new Set(JSON.parse(value) as string[]),
})
```

**After**:
```typescript
import { $mastodonInstances, saveMastodonInstance, removeMastodonInstance } from '@lib/state'

// Use centralized store instead of local persistentAtom
export { $mastodonInstances as $savedInstances }
export { saveMastodonInstance as saveInstance }
export { removeMastodonInstance as removeInstance }
```

#### 4.5 Social Embed Cache

**Before** (`Social/Embed/client.ts`):
```typescript
private getCachedData(): OEmbedResponse | null {
  try {
    const cached = localStorage.getItem(this.getCacheKey())
    if (!cached) return null
    // ... TTL logic ...
  } catch (error) {
    return null
  }
}
```

**After**:
```typescript
import { getCachedEmbed, cacheEmbed } from '@lib/state'

private getCachedData(): OEmbedResponse | null {
  // Store handles consent checking and TTL automatically
  return getCachedEmbed(this.getCacheKey()) as OEmbedResponse | null
}

private cacheData(data: OEmbedResponse): void {
  const ttl = data.cache_age ? data.cache_age * 1000 : DEFAULT_TTL
  cacheEmbed(this.getCacheKey(), data, ttl)
}
```

---

### Phase 5: Initialization (Week 3)

#### 5.1 App Bootstrap

**File**: `src/components/Scripts/bootstrap/client.ts` (NEW)

```typescript
/**
 * Application Bootstrap
 * Initializes state management on every page load
 */
import { LoadableScript, type TriggerEvent } from '../loader/@types/loader'
import { initConsentFromCookies, initStateSideEffects } from '@lib/state'

export class AppBootstrap extends LoadableScript {
  static override scriptName = 'AppBootstrap'
  static override eventType: TriggerEvent = 'astro:before-preparation'

  static override init(): void {
    // 1. Load consent from cookies into store
    initConsentFromCookies()

    // 2. Setup side effects (runs once)
    initStateSideEffects()

    console.log('App state initialized')
  }

  static override pause(): void {}
  static override resume(): void {}
}
```

Add to loader registry:
```typescript
// src/components/Scripts/loader/registry.ts
import { AppBootstrap } from '../bootstrap/client'

export const scripts = [
  AppBootstrap, // FIRST - runs before everything
  HeadThemeSetup,
  ThemePicker,
  // ... rest
]
```

---

### Phase 6: Testing (Week 4)

#### 6.1 State Management Tests

**File**: `src/lib/state/__tests__/index.spec.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  $consent,
  $theme,
  updateConsent,
  setTheme,
  initConsentFromCookies,
  $hasAnalyticsConsent,
} from '../index'
import Cookies from 'js-cookie'

describe('State Management', () => {
  beforeEach(() => {
    // Reset stores
    $consent.set({
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false,
    })
    $theme.set('default')

    // Clear cookies
    vi.clearAllMocks()
  })

  describe('Consent Management', () => {
    it('should initialize consent from cookies', () => {
      vi.spyOn(Cookies, 'get').mockImplementation((name: string) => {
        if (name === 'consent_analytics') return 'true'
        return undefined
      })

      initConsentFromCookies()

      expect($consent.get().analytics).toBe(true)
    })

    it('should update consent and cookie together', () => {
      const setCookieSpy = vi.spyOn(Cookies, 'set')

      updateConsent('analytics', true)

      expect($consent.get().analytics).toBe(true)
      expect(setCookieSpy).toHaveBeenCalledWith(
        'consent_analytics',
        'true',
        expect.objectContaining({ expires: 365 })
      )
    })

    it('should trigger side effects when consent changes', () => {
      const callback = vi.fn()
      $hasAnalyticsConsent.subscribe(callback)

      updateConsent('analytics', true)

      expect(callback).toHaveBeenCalledWith(true)
    })
  })

  describe('Theme Management', () => {
    it('should persist theme when functional consent granted', () => {
      updateConsent('functional', true)

      setTheme('dark')

      expect($theme.get()).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('"dark"')
    })

    it('should not persist theme when functional consent denied', () => {
      updateConsent('functional', false)

      setTheme('dark')

      expect(localStorage.getItem('theme')).toBeNull()
    })
  })
})
```

---

## Migration Checklist

### Pre-Migration

- [ ] Review all components that use state (see STORE.md)
- [ ] Create backup branch: `git checkout -b state-refactor-backup`
- [ ] Run full test suite: `npm run test`
- [ ] Document current localStorage/cookie values in production

### Migration Steps

**Week 1: Foundation**
- [ ] Install `js-cookie` and types
- [ ] Create `src/lib/state/index.ts` with all stores
- [ ] Create `src/lib/state/cookies.ts` with js-cookie utilities
- [ ] Write tests for state management
- [ ] Create `AppBootstrap` script

**Week 2: Loader Integration**
- [ ] Update `Loader.initializeConsentGatedExecution()`
- [ ] Add consent change subscriptions
- [ ] Test consent-gated script loading/unloading
- [ ] Update Sentry to use consent-gated event

**Week 3: Component Refactoring**
- [ ] Refactor `ThemePicker/client.ts`
- [ ] Refactor `Cookies/Consent/cookies.ts`
- [ ] Refactor `Cookies/Customize/client.ts`
- [ ] Refactor `Social/Mastodon/store.ts`
- [ ] Refactor `Social/Embed/client.ts`
- [ ] Refactor `Cookies/Consent/state.ts` (modal visibility)

**Week 4: Testing & Validation**
- [ ] Update all component tests to use new state API
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Manual testing: consent changes reload scripts
- [ ] Manual testing: theme persists with functional consent
- [ ] Manual testing: localStorage cleared when consent revoked
- [ ] Performance testing: no FOUC, no layout shift

**Week 5: Documentation & Cleanup**
- [ ] Update STORE.md with new architecture
- [ ] Document state API in `lib/state/README.md`
- [ ] Add migration guide for future state additions
- [ ] Remove old `Scripts/state/utility.ts` (replaced by cookies.ts)
- [ ] Update component documentation

---

## Benefits of This Architecture

### 1. **Consistency**
✅ All state uses Nanostores
✅ All cookie operations use js-cookie
✅ All consent checks use computed stores
✅ Single file (`lib/state/index.ts`) for all state

### 2. **Automatic Consent Enforcement**
✅ Scripts reload when consent granted (your requirement!)
✅ Scripts unload when consent revoked
✅ localStorage cleared when consent revoked
✅ No manual consent checking in components

### 3. **Type Safety**
✅ Full TypeScript support
✅ Compile-time checks for state shape
✅ IDE autocomplete for all state operations

### 4. **Testability**
✅ Stores are easily mockable
✅ Side effects can be tested independently
✅ No DOM dependencies in state logic

### 5. **Performance**
✅ Tiny bundle size (1KB total)
✅ No unnecessary re-renders
✅ Efficient change detection
✅ No FOUC with theme

### 6. **Developer Experience**
✅ One place to look for all state
✅ Clear action functions (no manual `setItem` calls)
✅ Reactive by default (like RTK's `createAsyncThunk`)
✅ Easy to add new state (follow the pattern)

### 7. **GDPR Compliance**
✅ Cookies remain source of truth (legal requirement)
✅ Consent changes trigger automatic enforcement
✅ Clear audit trail (timestamps in consent)
✅ Easy to implement "right to erasure"

---

## Example: Adding New State

**Future-proof pattern** for adding new state:

```typescript
// 1. Add store to lib/state/index.ts
export const $newFeature = persistentAtom('newFeature', defaultValue)

// 2. Add action
export function updateNewFeature(value: string): void {
  const hasConsent = $consent.get().functional
  if (hasConsent) {
    $newFeature.set(value)
  }
}

// 3. Add side effect (if needed)
export function initStateSideEffects(): void {
  // ... existing side effects ...

  $newFeature.subscribe((value) => {
    // Do something when newFeature changes
    console.log('New feature updated:', value)
  })
}

// 4. Use in component
import { $newFeature, updateNewFeature } from '@lib/state'

// Read
const value = $newFeature.get()

// Subscribe to changes
$newFeature.subscribe((newValue) => {
  console.log('Updated to:', newValue)
})

// Update
updateNewFeature('new value')
```

**That's it!** No Redux boilerplate, no reducers, no action types, no middleware configuration.

---

## Comparison: Before vs After

### Before (Current - Inconsistent)

```typescript
// ThemePicker - direct localStorage
localStorage.setItem('theme', themeId)

// Mastodon - Nanostores
$savedInstances.set(new Set([domain]))

// Cookies - manual parsing
document.cookie = `consent_analytics=true;Max-Age=...`

// Cookie modal - custom JSON
localStorage.setItem('COOKIE_MODAL_VISIBLE', JSON.stringify({ visible: true }))

// Embed cache - manual TTL logic
localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp, ttl }))
```

**Problems**: 5 different patterns, no reactivity, manual consent checks, scattered logic

### After (Proposed - Unified)

```typescript
// Import once, use everywhere
import { setTheme, saveMastodonInstance, updateConsent, $cookieModalVisible, cacheEmbed } from '@lib/state'

// Theme - single action, automatic consent check
setTheme('dark')

// Mastodon - single action, automatic consent check
saveMastodonInstance('mastodon.social')

// Cookies - single action, automatic side effects
updateConsent('analytics', true) // Reloads scripts automatically!

// Cookie modal - simple atom
$cookieModalVisible.set(true)

// Embed cache - single action, automatic TTL
cacheEmbed('twitter_123', data, 3600000)
```

**Benefits**: 1 pattern, fully reactive, automatic consent, centralized logic

---

## Risk Assessment

### Low Risk ✅

- **Bundle Size**: +2KB (js-cookie) - negligible
- **Breaking Changes**: Internal refactor, no API changes for users
- **Performance**: Nanostores is faster than current manual approach
- **GDPR Compliance**: Improves compliance (automatic enforcement)

### Medium Risk ⚠️

- **Migration Effort**: 4 weeks of focused work
- **Test Updates**: All component tests need updates
- **Learning Curve**: Team needs to learn Nanostores patterns (but simpler than Redux)

### Mitigation Strategies

1. **Gradual Rollout**: Migrate one component at a time
2. **Feature Flags**: Keep old code temporarily during migration
3. **Comprehensive Testing**: Test each component after migration
4. **Rollback Plan**: Keep backup branch, can revert if issues
5. **Documentation**: Detailed migration guide and examples

---

## Success Metrics

After completion, we should have:

- [ ] **1 state management pattern** (Nanostores) across all components
- [ ] **1 cookie utility** (js-cookie) across all components
- [ ] **1 source file** (`lib/state/index.ts`) for all state
- [ ] **Automatic script reloading** when consent changes
- [ ] **Zero manual consent checks** in components
- [ ] **Zero direct localStorage calls** in components (except early theme load)
- [ ] **Zero manual cookie parsing** in components
- [ ] **100% test coverage** for state management
- [ ] **No regressions** in existing functionality

---

## Next Steps

1. **Review this plan** - provide feedback
2. **Approve dependencies** - js-cookie
3. **Create migration branch** - `git checkout -b feature/unified-state-management`
4. **Begin Week 1** - Foundation setup

Ready to proceed?
