# Cookie Consent System Overview

## How the Components Work Together

### 1. Cookie Consent Banner (`src/components/Consent/Banner/`)

**Purpose:** First-time visitor prompt that appears at the bottom of the page asking for cookie consent.

**Initialization Flow:**

- Uses **LoadableScript pattern** with `delayed` trigger (appears after a delay)
- On init, calls `initConsentCookies()` which:
  - Checks if `consent_necessary` cookie exists
  - If not set: Creates 4 cookies (`consent_necessary`, `consent_analytics`, `consent_advertising`, `consent_functional`) all set to `unknown` and shows the modal
  - If already set to anything other than `unknown`: Skips showing the modal (user already made a choice)
  - If set to `unknown`: Shows the modal again

**User Actions:**

1. **"Allow All" button** → Calls `allowAllConsentCookies()` which sets all 4 consent cookies to `granted`, hides banner
2. **"Customize" button** → Opens the Preferences modal (detailed preference center)
3. **Close button** → Just hides the modal without changing consent (keeps `unknown` state)

**State Storage:**

- **Cookies:** `consent_necessary`, `consent_analytics`, `consent_advertising`, `consent_functional` (values: `granted`, `refused`, or `unknown`)
- **localStorage:** `COOKIE_MODAL_VISIBLE` tracks if modal is currently shown

---

### 2. Cookie Preferences Modal (`src/components/Consent/Preferences/`)

**Purpose:** Detailed preference center where users can toggle individual cookie categories.

**Features:**

- **Strictly Necessary:** Always enabled (cannot be toggled)
- **Performance/Analytics:** Toggleable checkbox (`analytics-cookies`)
- **Functional:** Toggleable checkbox (`functional-cookies`)
- **Advertising:** Toggleable checkbox (`advertising-cookies`)

**User Actions:**

1. **"Allow All" button** → Sets all preferences to `true`, saves to cookie, calls `applyPreferences()`
2. **"Save Preferences" button** → Reads checkbox states, saves to cookie, calls `applyPreferences()`
3. **Close button** → Closes modal without saving changes

**Storage:**

- Saves to a single cookie: `webstack-cookie-consent` (JSON object)
- Contains: `{ necessary, analytics, functional, advertising, timestamp }`

---

## How Cookie Blocking Works

### Current Implementation (Placeholder)

The `applyPreferences()` method in `Customize/client.ts` (lines 158-190) contains **placeholder code**:

```typescript
applyPreferences(preferences: CookiePreferences): void {
  if (preferences.analytics) {
    console.log('Analytics cookies enabled')
    this.enableAnalytics()
  } else {
    console.log('Analytics cookies disabled')
    this.disableAnalytics()
  }
  // Similar for functional and advertising
}

private enableAnalytics(): void {
  // Implement analytics cookie enabling logic
  // Example: Load Google Analytics
  // gtag('config', 'GA_MEASUREMENT_ID')
}

private disableAnalytics(): void {
  // Implement analytics cookie disabling logic
  // Example: Disable Google Analytics
  // window['ga-disable-GA_MEASUREMENT_ID'] = true
}
```

### Intended Pattern for Prevention

To prevent cookies from being set when opted out, you need to:

1. **Before loading any analytics/advertising script**, check consent:

```typescript
import { getConsentCookie } from '@components/Consent/Banner/cookies'

const analyticsConsent = getConsentCookie('analytics')
if (analyticsConsent === 'granted') {
  // Load Google Analytics script
  gtag('config', 'GA_MEASUREMENT_ID')
}
```

2. **For third-party scripts**, implement the enable/disable methods:
   - **Enable:** Dynamically inject the script tag
   - **Disable:** Set opt-out flags (e.g., `window['ga-disable-GA_MEASUREMENT_ID'] = true`)

3. **Export the `getConsentCookie` function** from the consent module so other components can check before setting non-essential cookies

---

## Key Architecture Points

- **Two separate systems:** Consent uses individual cookies per category (`consent_*`), while Customize uses a single JSON cookie (`webstack-cookie-consent`)
- **Consent cookies are the source of truth:** These should be checked by analytics/advertising scripts before executing
- **Modal visibility:** Tracked in localStorage to prevent showing consent modal on every page load
- **LoadableScript pattern:** Both components use this pattern for proper lifecycle management with View Transitions
- **No enforcement yet:** The actual blocking logic (`enableAnalytics()`, `disableAdvertising()`, etc.) is stubbed out with comments showing where to implement it

---

## What's Missing

The infrastructure is complete, but **actual cookie blocking is not implemented**. You need to:

1. Fill in the `enableAnalytics()`, `disableAnalytics()`, etc. methods
2. Have all analytics/advertising scripts check `getConsentCookie()` before running
3. Consider consolidating the two cookie systems (Consent vs Customize) or ensuring they stay in sync

---

## File Structure

```
src/components/Cookies/
├── Consent/
│   ├── index.astro          # Modal UI component
│   ├── client.ts            # CookieConsent LoadableScript
│   ├── cookies.ts           # Cookie state management (consent_*)
│   ├── state.ts             # Modal visibility (localStorage)
│   ├── selectors.ts         # DOM element getters
│   └── __tests__/
└── Customize/
    ├── index.astro          # Detailed preference center UI
    ├── client.ts            # CookieCustomize LoadableScript
    └── __tests__/
```
