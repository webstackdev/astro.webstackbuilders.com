# State Management Analysis

Comprehensive inventory of all state management in the `src/components` directory.

**Analysis Date**: October 19, 2025

---

## 1. localStorage State Management

### A. Theme Preferences

**Location**: `ThemePicker/client.ts`

- **Key**: `'theme'`
- **Data Stored**: Theme ID (`'default'`, `'dark'`, or `'holiday'`)
- **Purpose**: Persist user theme selection across sessions
- **GDPR Category**: **Functional** (user preference)
- **Operations**:
  - `localStorage.getItem(THEME_STORAGE_KEY)` - Read theme preference
  - `localStorage.setItem(THEME_STORAGE_KEY, themeId)` - Save theme selection
- **Consent Required**: ✅ Yes (functional cookie consent)

### B. Cookie Modal Visibility

**Location**: `Cookies/Consent/state.ts`

- **Key**: `'COOKIE_MODAL_VISIBLE'`
- **Data Stored**: `{ visible: boolean }`
- **Purpose**: Track whether cookie consent modal should be displayed
- **GDPR Category**: **Necessary** (GDPR compliance mechanism)
- **Operations**:
  - `getCookieModalVisibility()` - Read modal state
  - `setCookieModalVisibility(visible)` - Update modal state
  - `initCookieModalVisibility()` - Initialize modal as visible
- **Consent Required**: ❌ No (necessary for GDPR compliance itself)

### C. Social Media Embed Cache

**Location**: `Social/Embed/client.ts`

- **Key Pattern**: `'embed_cache_${platform}_${encodedUrl}'`
- **Data Stored**:
  ```typescript
  {
    data: OEmbedResponse,
    timestamp: number,
    ttl: number
  }
  ```
- **Purpose**: Cache oEmbed responses for social media embeds (Twitter, YouTube, etc.)
- **GDPR Category**: **Functional** (performance optimization)
- **Operations**:
  - `getCachedData()` - Read cached embed data
  - `cacheData(data)` - Store embed response with TTL
  - `localStorage.removeItem(cacheKey)` - Clear expired cache
- **Consent Required**: ✅ Yes (functional consent)

### D. Mastodon Instances

**Location**: `Social/Mastodon/store.ts`

- **Key**: `'mastodonInstances'`
- **Data Stored**: Set of Mastodon instance domains (up to 5 most recent)
- **Purpose**: Remember user's preferred Mastodon instances for sharing
- **GDPR Category**: **Functional** (user preference)
- **Library**: Uses `@nanostores/persistent` for reactive state
- **Operations**:
  - `$savedInstances.get()` - Read saved instances
  - `saveInstance(instance)` - Add instance to list (FIFO with max 5)
  - `removeInstance(instance)` - Remove specific instance
  - `clearInstances()` - Clear all saved instances
- **Consent Required**: ✅ Yes (functional consent)

### E. Current Mastodon Instance

**Location**: `Social/Mastodon/store.ts`

- **Key**: `'mastodonCurrentInstance'`
- **Data Stored**: Currently selected Mastodon instance domain (string or undefined)
- **Purpose**: Track actively selected instance for sharing
- **GDPR Category**: **Functional** (user preference)
- **Library**: Uses `@nanostores/persistent`
- **Operations**:
  - `$currentInstance.get()` - Read current instance
  - `$currentInstance.set(domain)` - Set current instance
- **Consent Required**: ✅ Yes (functional consent)

---

## 2. Cookies (document.cookie) State Management

### A. Cookie Consent Preferences

**Location**: `Cookies/Customize/client.ts`

- **Cookie Name**: `'webstack-cookie-consent'`
- **Data Stored**:
  ```typescript
  {
    necessary: boolean,
    analytics: boolean,
    functional: boolean,
    advertising: boolean,
    timestamp: string  // ISO date
  }
  ```
- **Purpose**: Store user's GDPR cookie consent choices
- **GDPR Category**: **Necessary** (legal requirement)
- **Operations**:
  - `getCookie(consentCookie)` - Read consent preferences
  - `setCookie(consentCookie, JSON.stringify(preferences), 365)` - Save preferences (1 year expiry)
- **Consent Required**: ❌ No (necessary for consent mechanism itself)

### B. Individual Consent Cookies

**Location**: `Cookies/Consent/cookies.ts`

- **Cookie Names**:
  - `'consent_necessary'`
  - `'consent_analytics'`
  - `'consent_advertising'`
  - `'consent_functional'`
- **Data Stored**: `'true'` or `'false'` (string values)
- **Purpose**: Granular tracking of each consent category
- **GDPR Category**: **Necessary**
- **Operations**: Standard cookie utility functions (getCookie, setCookie, removeCookie)
- **Consent Required**: ❌ No (necessary for consent system)

### C. Cookie Utility Functions

**Location**: `Scripts/state/utility.ts`

Provides cookie management utilities used throughout the application:

```typescript
getCookie(name: string): string | null
setCookie(name: string, value: string, days?: number): void
removeCookie(name: string): void
```

---

## 3. Window Global State Management

### A. Theme Meta Colors

**Location**: Initialized in `Head/client.ts`, consumed in `ThemePicker/client.ts`

- **Global**: `window.metaColors`
- **Data Stored**:
  ```typescript
  {
    'default': '#e2e2e2',
    'dark': '#00386d',
    // ... more themes
  }
  ```
- **Purpose**: Share theme color data between Head and ThemePicker components for updating `<meta name="theme-color">` element
- **GDPR Category**: **Not applicable** (in-memory only, not persisted)
- **Operations**:
  - `HeadThemeSetup.initializeMetaColors()` - Initialize on page load
  - `window.metaColors[themeId]` - Read color for theme
- **Consent Required**: ❌ No (runtime-only state, not stored)

### B. Google Analytics Opt-Out (Commented/Disabled)

**Location**: `Cookies/Customize/client.ts` (Line 196)

- **Code**: `// window['ga-disable-GA_MEASUREMENT_ID'] = true`
- **Status**: ⚠️ Not currently implemented
- **Purpose**: Would disable Google Analytics when analytics consent is denied
- **GDPR Category**: **Analytics**
- **Consent Required**: ✅ Yes (when implemented)

---

## 4. Summary by GDPR Consent Category

### Necessary (No consent required)

1. ✅ Cookie Modal Visibility (localStorage: `COOKIE_MODAL_VISIBLE`)
2. ✅ Cookie Consent Preferences (cookie: `webstack-cookie-consent`)
3. ✅ Individual Consent Cookies (`consent_*`)

### Functional (Requires functional consent)

1. ⚠️ Theme Preference (localStorage: `theme`) - **NEEDS CONSENT CHECK**
2. ⚠️ Social Media Embed Cache (localStorage: `embed_cache_*`) - **NEEDS CONSENT CHECK**
3. ⚠️ Mastodon Instances (localStorage: `mastodonInstances`) - **NEEDS CONSENT CHECK**
4. ⚠️ Current Mastodon Instance (localStorage: `mastodonCurrentInstance`) - **NEEDS CONSENT CHECK**

### Analytics (Requires analytics consent)

1. ⚠️ Sentry Error Monitoring - **NEEDS CONSENT-GATED LOADING**
2. 🚫 Google Analytics - Not implemented (commented out)

### Advertising (Requires advertising consent)

1. 🚫 None currently implemented

---

## 5. GDPR Implementation Priorities

### HIGH PRIORITY (Currently storing without consent checks)

1. **ThemePicker** - Must check `consent_functional` before using localStorage
   - File: `src/components/ThemePicker/client.ts`
   - Lines: 125, 197
   - Action: Add consent check before `localStorage.getItem/setItem`

2. **Social/Embed** - Must check `consent_functional` before caching
   - File: `src/components/Social/Embed/client.ts`
   - Lines: 432, 440, 459
   - Action: Add consent check before cache operations

3. **Social/Mastodon** - Must check `consent_functional` before persisting instances
   - File: `src/components/Social/Mastodon/store.ts`
   - Lines: 20-30
   - Action: Conditionally initialize persistentAtom based on consent

4. **Scripts/sentry** - Must check `consent_analytics` before initializing
   - File: `src/components/Scripts/sentry/client.ts`
   - Action: Use consent-gated event type with `consentCategory: 'analytics'` metadata

### MEDIUM PRIORITY (Implement when adding features)

1. Analytics integration (Google Analytics, etc.)
2. Advertising pixel/tracking integration

### NO ACTION NEEDED (Already necessary)

1. ✅ Cookies/Consent system
2. ✅ Cookie Modal state

---

## 6. Recommended Implementation Strategy

### Step 1: Create Consent Utility Module

Create a centralized consent checking module:

```typescript
// src/lib/gdpr/consent.ts
import { getCookie } from '@components/Scripts/state/utility'

export function hasConsentFor(category: 'necessary' | 'analytics' | 'advertising' | 'functional'): boolean {
  const consentCookie = getCookie(`consent_${category}`)
  return consentCookie === 'true'
}

export function waitForConsent(category: string): Promise<boolean> {
  // Implementation for consent change listening
}
```

### Step 2: Update ThemePicker

```typescript
// Before localStorage operations
if (hasConsentFor('functional')) {
  localStorage.setItem(THEME_STORAGE_KEY, themeId)
} else {
  // Fallback to session-only state
}
```

### Step 3: Update Social Components

```typescript
// Social/Embed/client.ts
private getCachedData(): OEmbedResponse | null {
  if (!hasConsentFor('functional')) return null
  // ... existing cache logic
}
```

### Step 4: Gate Sentry with Consent

```typescript
// Scripts/sentry/client.ts
class SentryClient extends LoadableScript {
  static override eventType: TriggerEvent = 'consent-gated'
  static override meta: ConsentMetadata = {
    consentCategory: 'analytics'
  }
}
```

### Step 5: Add Consent Change Listener

Implement logic in loader system to:
- Listen for consent changes
- Re-evaluate which scripts should run
- Clear localStorage/cookies for revoked consent categories

### Step 6: Implement Consent Withdrawal

```typescript
// When consent is revoked
export function revokeConsentFor(category: string): void {
  // Remove consent cookie
  removeCookie(`consent_${category}`)

  // Clear related localStorage items
  if (category === 'functional') {
    localStorage.removeItem('theme')
    localStorage.removeItem('mastodonInstances')
    localStorage.removeItem('mastodonCurrentInstance')
    // Clear embed cache
    Object.keys(localStorage)
      .filter(key => key.startsWith('embed_cache_'))
      .forEach(key => localStorage.removeItem(key))
  }
}
```

---

## 7. Testing Checklist

- [ ] Theme preference respects functional consent
- [ ] Theme falls back gracefully when consent denied
- [ ] Social embed cache only works with functional consent
- [ ] Mastodon instances only persist with functional consent
- [ ] Sentry only loads with analytics consent
- [ ] Consent withdrawal clears appropriate storage
- [ ] Consent change triggers script re-evaluation
- [ ] Necessary cookies work without consent prompts

---

## 8. Related Documentation

- [GDPR Compliance Plan](../../../GDPRConsent/GDPR_COMPLIANCE_PLAN.md)
- [GDPR Questions & Answers](../../../GDPRConsent/GDPR_QUESTIONS.md)
- [Consent-Gated Event Documentation](../../loader/CONSENT_GATED_EVENT.md)
- [Load Events Documentation](../../loader/LOAD_EVENTS.md)
- [Cookie Utilities](./utility.ts)

---

## 9. State Management Architecture

### Storage Hierarchy

```
Browser Storage
├── localStorage (Persistent)
│   ├── Necessary
│   │   └── COOKIE_MODAL_VISIBLE
│   └── Functional (Requires Consent)
│       ├── theme
│       ├── mastodonInstances
│       ├── mastodonCurrentInstance
│       └── embed_cache_*
│
├── Cookies (Persistent)
│   └── Necessary
│       ├── webstack-cookie-consent
│       ├── consent_necessary
│       ├── consent_analytics
│       ├── consent_advertising
│       └── consent_functional
│
└── window (Session Only)
    └── metaColors (Runtime state, no consent needed)
```

### Data Flow

```
User Interaction
    ↓
Consent Check (hasConsentFor)
    ↓
┌─── Granted ────┐         ┌─── Denied ────┐
│                │         │               │
Store to         │         │  Fallback to  │
Persistent       │         │  Session/     │
Storage          │         │  No-op        │
└────────────────┘         └───────────────┘
```

---

## 10. Notes

- All localStorage operations in production components must be consent-gated
- The `@nanostores/persistent` library automatically syncs with localStorage
- Consent cookies themselves are exempt from consent requirements (necessary category)
- Window globals for runtime-only state don't require consent
- Cache TTL for embeds respects the `cache_age` from oEmbed responses
- Mastodon store maintains FIFO queue of max 5 instances
