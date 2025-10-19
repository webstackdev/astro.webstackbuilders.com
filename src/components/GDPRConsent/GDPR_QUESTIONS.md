# GDPR Questions & Answers

## Additional Considerations with new 'consent-gated' event in Loader

a) Should consent-gated scripts re-check on consent changes?

If user grants consent later, should scripts load dynamically? Requires listening to consent change events

b) Fallback behavior:

If meta.consentCategory is missing, what happens? Default to blocking? Allow through? Warn in console?

c) Integration with cookie consent system:

Should loader import from @components/Cookies/Consent/cookies? Or should meta include a callback function?

## Does Sentry error monitoring present issues with GDPR?

### Short Answer

**Yes**, Sentry can present GDPR compliance issues, but they are manageable with proper configuration.

---

### Current Sentry Implementation

**Location:** `src/components/Scripts/sentry/client.ts`

**Key Configuration:**
```typescript
sendDefaultPii: true,  // ⚠️ Sends IP addresses and user agents
replaysSessionSampleRate: 0.1,  // Records 10% of sessions
replaysOnErrorSampleRate: 1.0,  // Records 100% of error sessions
```

**Session Replay Settings:**
```typescript
replayIntegration({
  maskAllText: false,     // ⚠️ Records actual text content
  blockAllMedia: false,   // ⚠️ Records media
  maskAllInputs: true,    // ✅ Masks form inputs (good!)
})
```

---

### GDPR Concerns with Sentry

#### 1. **Personal Data Collection**

Sentry collects:
- ✅ **IP addresses** (via `sendDefaultPii: true`)
- ✅ **User agents** (browser, OS info)
- ✅ **Session recordings** (visual playback of user actions)
- ✅ **Breadcrumbs** (console logs, fetch requests, navigation)
- ⚠️ **Potentially PII in error messages** (email addresses, names in stack traces)

Under GDPR, IP addresses are considered personal data (CJEU ruling Case C-582/14).

#### 2. **Legitimate Interest vs. Consent**

**Current Status:** Sentry loads without explicit user consent

**GDPR Requirements:**
- **Strictly Necessary Cookies/Processing:** Exception to consent requirement (Article 6(1)(f))
- **Analytics/Error Monitoring:** Generally requires consent UNLESS you can prove legitimate interest

**Sentry's Position:**
- Error monitoring can be justified as legitimate interest (security, service stability)
- **BUT** Session Replay is harder to justify - it's more intrusive

#### 3. **Data Minimization Violation**

**Issue:** Recording 10% of ALL sessions (`replaysSessionSampleRate: 0.1`) goes beyond what's necessary for error monitoring.

**GDPR Article 5(1)(c):** Data must be "adequate, relevant and limited to what is necessary"

#### 4. **Transparency**

**Missing:**
- No mention of Sentry in Privacy Policy
- Users not informed about session recording
- No opt-out mechanism

---

### GDPR-Compliant Sentry Configuration

#### Option 1: Consent-Based Approach (Strictest)

**Require consent before initializing Sentry:**

```typescript
// src/components/Scripts/sentry/client.ts

import { getConsentCookie } from '@components/Cookies/Consent/cookies'

const isProd = import.meta.env.PROD
const isDev = import.meta.env.DEV

// Check for analytics consent before initializing
const analyticsConsent = getConsentCookie('analytics')

if (isProd && PUBLIC_SENTRY_DSN && analyticsConsent === 'granted') {
  const client = new BrowserClient({
    // ... configuration
  })
  getCurrentScope().setClient(client)
  client.init()
} else if (analyticsConsent !== 'granted') {
  console.info('🔒 Sentry disabled - user has not consented to analytics')
}
```

**Pros:**
- Fully GDPR compliant
- User has control
- Clear consent trail

**Cons:**
- Miss errors from users who don't consent
- Reduced error coverage

---

#### Option 2: Legitimate Interest (More Practical)

**Justify error monitoring as legitimate interest, but disable intrusive features:**

```typescript
const client = new BrowserClient({
  dsn: PUBLIC_SENTRY_DSN,

  // Disable session replay entirely (most intrusive feature)
  integrations: [
    // Remove replayIntegration() completely
    breadcrumbsIntegration({
      console: false,  // Don't log console messages (may contain PII)
      dom: false,      // Don't log DOM events
      fetch: true,     // Keep fetch for debugging
      history: true,   // Keep navigation
      xhr: true,
    }),
    // ... other integrations
  ],

  // Reduce PII collection
  sendDefaultPii: false,  // Don't send IP/user agent automatically

  // Remove session replay sampling
  // replaysSessionSampleRate: 0,  // Don't record any sessions
  // replaysOnErrorSampleRate: 0,  // Don't record error sessions

  // Scrub sensitive data before sending
  beforeSend(event, hint) {
    // Remove IP address
    if (event.user) {
      delete event.user.ip_address
    }

    // Remove email from error messages
    if (event.message) {
      event.message = event.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
    }

    // Scrub breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(crumb => ({
        ...crumb,
        message: crumb.message?.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
      }))
    }

    return event
  },
})
```

**Pros:**
- Covers all users (better error detection)
- Still respects privacy
- Defensible under GDPR Article 6(1)(f)

**Cons:**
- Requires proper documentation in Privacy Policy
- Must conduct Legitimate Interest Assessment (LIA)

---

#### Option 3: Hybrid Approach (Recommended)

**Basic error monitoring via legitimate interest, enhanced features require consent:**

```typescript
import { getConsentCookie } from '@components/Cookies/Consent/cookies'

const isProd = import.meta.env.PROD
const analyticsConsent = getConsentCookie('analytics')

const integrations = [
  // Core error tracking (always enabled)
  globalHandlersIntegration(),
  linkedErrorsIntegration(),
  dedupeIntegration(),

  // Enhanced features (only with consent)
  ...(analyticsConsent === 'granted' ? [
    replayIntegration({
      maskAllText: true,      // Mask everything for privacy
      blockAllMedia: true,    // Block media
      maskAllInputs: true,
    }),
    breadcrumbsIntegration({
      console: true,
      dom: true,
    }),
  ] : []),
]

const client = new BrowserClient({
  dsn: PUBLIC_SENTRY_DSN,
  integrations,
  sendDefaultPii: analyticsConsent === 'granted',
  replaysSessionSampleRate: analyticsConsent === 'granted' ? 0.1 : 0,
  replaysOnErrorSampleRate: analyticsConsent === 'granted' ? 1.0 : 0,
  // ... other settings
})
```

---

### Required Privacy Policy Updates

Add to `/src/pages/privacy/index.astro`:

```markdown
## Error Monitoring and Analytics

### Sentry Error Tracking

We use Sentry (https://sentry.io) to monitor and improve the stability of our website.
Sentry helps us identify and fix errors that occur while you use our site.

**Data Collected (Legitimate Interest):**
- Error messages and stack traces
- Page URL where error occurred
- Browser type and version
- Timestamp of error

**Data Collected (With Your Consent - Analytics Cookies):**
- IP address (anonymized)
- User agent details
- Session recordings (with sensitive data masked)
- Navigation patterns

**Legal Basis:**
- Basic error monitoring: Legitimate interest (Article 6(1)(f) GDPR)
- Enhanced analytics: Consent (Article 6(1)(a) GDPR)

**Data Retention:** 90 days

**Data Location:** Sentry is hosted in the United States. Data is transferred
under EU-US Data Privacy Framework.

**Your Rights:** You can opt out of enhanced tracking by declining analytics
cookies in our cookie preferences.

**Sentry Privacy Policy:** https://sentry.io/privacy/
```

---

### Sentry-Specific GDPR Features

**Sentry offers GDPR tools:**

1. **Data Scrubbing Rules** - Automatically remove PII from error reports
2. **IP Anonymization** - Hash IP addresses before storage
3. **Data Subject Access Requests** - API to export user data
4. **Data Deletion** - API to delete specific user data

**Configuration in Sentry Dashboard:**
- Settings → Security & Privacy → Data Scrubbing
- Enable "Prevent Storing of IP Addresses"
- Add scrubbing rules for email patterns, phone numbers, etc.

---

### Action Items

**Immediate (Required for GDPR):**
- [ ] Update Privacy Policy to disclose Sentry usage
- [ ] Disable Session Replay or require consent
- [ ] Set `sendDefaultPii: false` or require consent
- [ ] Implement `beforeSend` scrubbing for PII
- [ ] Add Sentry to cookie policy

**Medium-term (Recommended):**
- [ ] Implement consent-gated Sentry initialization
- [ ] Conduct Legitimate Interest Assessment (LIA)
- [ ] Configure Sentry dashboard data scrubbing rules
- [ ] Set up data retention policy (auto-delete after 90 days)
- [ ] Create process for handling data deletion requests

**Long-term (Best Practice):**
- [ ] Integrate Sentry with consent logging system
- [ ] Implement user-specific data deletion via Sentry API
- [ ] Regular GDPR compliance audits
- [ ] Train team on PII handling

---

## Question 2: Are cookie consent cookies needed server-side or at API endpoints?

### Short Answer
**Currently no**, but **future yes** for proper GDPR compliance.

---

### Current Implementation Analysis

#### Cookie Storage is Client-Side Only

**Location:** `src/components/Cookies/Consent/cookies.ts`

**All functions use client-side `document.cookie`:**
```typescript
import { getCookie, setCookie, removeCookie } from '@components/Scripts/state'

// These functions only work in the browser
export const getConsentCookie = (name: Categories) => {
  const necessary = getCookie(`consent_necessary`)  // Uses document.cookie
  if (!necessary) initConsentCookies()
  return getCookie(prefixConsentCookie(name))
}
```

**From `src/components/Scripts/state/utility.ts`:**
```typescript
export const getCookie = (name: string): string | undefined => {
  // Direct access to document.cookie (browser-only API)
  document.cookie.split('; ').forEach(keyValue => {
    // ...
  })
}
```

#### No Server-Side Usage Found

**API Endpoints:** Checked all API files in `api/` directory
- ❌ No imports of `getConsentCookie`
- ❌ No access to `consent_*` cookies
- ❌ No consent validation

**Astro Pages:** Checked all `.astro` files
- ❌ No server-side cookie access via `Astro.cookies`
- ❌ No SSR consent checking

---

### When Would Server-Side Access Be Needed?

#### 1. **Server-Side Analytics Integration**

If you add server-side analytics (e.g., Google Analytics measurement protocol):

```typescript
// api/pageview/index.ts
import { parse } from 'cookie'

export default async function handler(req: any, res: any) {
  const cookies = parse(req.headers.cookie || '')
  const analyticsConsent = cookies['consent_analytics']

  if (analyticsConsent === 'granted') {
    // Send pageview to Google Analytics
    await fetch('https://www.google-analytics.com/collect', {
      // ... tracking data
    })
  }

  res.status(200).json({ tracked: analyticsConsent === 'granted' })
}
```

#### 2. **GDPR Consent Logging API**

When implementing the GDPR module, you'll need server-side access:

```typescript
// api/gdpr/consent-log/index.ts
import { parse } from 'cookie'

export default async function handler(req: any, res: any) {
  const cookies = parse(req.headers.cookie || '')

  // Read current consent state from client cookies
  const consentState = {
    necessary: cookies['consent_necessary'],
    analytics: cookies['consent_analytics'],
    advertising: cookies['consent_advertising'],
    functional: cookies['consent_functional'],
  }

  // Log to database with timestamp and IP
  await logConsentToDatabase({
    ...consentState,
    ip: req.headers['x-forwarded-for'],
    timestamp: new Date(),
  })

  res.status(200).json({ success: true })
}
```

#### 3. **SSR Personalization Based on Consent**

If you want to server-render different content based on consent:

```astro
---
// src/pages/index.astro
const consentCookies = Astro.cookies.get('consent_analytics')
const hasAnalyticsConsent = consentCookies?.value === 'granted'
---

<html>
  <body>
    {hasAnalyticsConsent && (
      <!-- Server-render analytics script -->
      <script src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    )}
  </body>
</html>
```

#### 4. **Third-Party Service Webhooks**

If external services need to respect user consent:

```typescript
// api/webhook/convertkit/index.ts
export default async function handler(req: any, res: any) {
  const { email, action } = req.body

  // Check if user has marketing consent in database
  const user = await getUserByEmail(email)

  if (user.marketingConsent === 'refused') {
    // Don't process marketing webhook
    return res.status(200).json({ skipped: 'no_consent' })
  }

  // Process webhook
  await processWebhook(req.body)
  res.status(200).json({ success: true })
}
```

---

### Recommended Implementation for Future

#### Create Server-Side Consent Utilities

**File:** `src/lib/gdpr/consent.ts`

```typescript
import type { AstroCookies } from 'astro'

export type ConsentCategory = 'necessary' | 'analytics' | 'advertising' | 'functional'
export type ConsentValue = 'granted' | 'refused' | 'unknown'

/**
 * Get consent cookie value server-side (Astro SSR)
 */
export function getServerSideConsent(
  cookies: AstroCookies,
  category: ConsentCategory
): ConsentValue {
  const cookieName = `consent_${category}`
  const consent = cookies.get(cookieName)
  return (consent?.value as ConsentValue) || 'unknown'
}

/**
 * Check if user has granted consent for a category
 */
export function hasConsent(
  cookies: AstroCookies,
  category: ConsentCategory
): boolean {
  return getServerSideConsent(cookies, category) === 'granted'
}

/**
 * Get consent cookie value in API endpoints (Node.js Request)
 */
export function getApiConsent(
  cookieHeader: string | undefined,
  category: ConsentCategory
): ConsentValue {
  if (!cookieHeader) return 'unknown'

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=')
      return [key, v.join('=')]
    })
  )

  const cookieName = `consent_${category}`
  return (cookies[cookieName] as ConsentValue) || 'unknown'
}
```

**Usage in Astro pages:**
```astro
---
// src/pages/analytics.astro
import { hasConsent } from '@lib/gdpr/consent'

const analyticsEnabled = hasConsent(Astro.cookies, 'analytics')
---

{analyticsEnabled && (
  <script src="/analytics.js"></script>
)}
```

**Usage in API endpoints:**
```typescript
// api/track/index.ts
import { getApiConsent } from '@lib/gdpr/consent'

export default async function handler(req: any, res: any) {
  const consent = getApiConsent(req.headers.cookie, 'analytics')

  if (consent !== 'granted') {
    return res.status(403).json({ error: 'Analytics consent required' })
  }

  // Track analytics
  await trackEvent(req.body)
  res.status(200).json({ success: true })
}
```

---

### Current State vs. Future Needs

| Use Case | Current Need | Future Need (GDPR) |
|----------|-------------|-------------------|
| Cookie consent modal | ✅ Client-side only | ✅ Client-side only |
| Cookie preference saving | ✅ Client-side only | ✅ Client-side only |
| Analytics script loading | ✅ Client-side check | ✅ Client-side check |
| Consent audit logging | ❌ Not implemented | ✅ Server-side required |
| Server-side analytics | ❌ Not implemented | ✅ Server-side required |
| Newsletter consent validation | ❌ Not implemented | ✅ Server-side required |
| Data deletion requests | ❌ Not implemented | ✅ Server-side required |
| SSR personalization | ❌ Not used | ⚠️ Optional (rare) |

---

### Recommendations

**For Current Setup (No Changes Needed):**
- Cookie consent cookies can remain client-side only
- Current implementation is sufficient for client-side analytics blocking
- No immediate need for server-side access

**For GDPR Compliance Module (Future):**
1. **Create server-side utilities** in `src/lib/gdpr/consent.ts`
2. **Use in API endpoints** for consent logging
3. **Use in newsletter API** to validate marketing consent
4. **Use in data request handler** to verify user consent state
5. **Consider SSR optimization** if you want to avoid loading scripts at all

**Migration Path:**
1. Phase 1 (Current): Client-side only ✅
2. Phase 2 (GDPR): Add server-side utilities for API endpoints
3. Phase 3 (Optimization): Optional SSR-based script loading

---

## Summary

### Sentry & GDPR
- ⚠️ **Current config violates GDPR** (Session Replay without consent, PII collection)
- ✅ **Fix:** Disable intrusive features OR gate them behind consent
- ✅ **Update Privacy Policy** to disclose Sentry usage
- ✅ **Implement data scrubbing** in `beforeSend` hook

### Server-Side Cookie Access
- ✅ **Currently not needed** - client-side only is fine
- ✅ **Future needed** for GDPR consent logging API
- ✅ **Create utilities** in `src/lib/gdpr/consent.ts` when implementing GDPR module
- ✅ **Use Astro.cookies** for SSR, parse headers for API endpoints

Both issues have clear solutions that align with the GDPR implementation plan in `/docs/GDPR_COMPLIANCE_PLAN.md`.
