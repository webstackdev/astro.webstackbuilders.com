# GDPR Module Overview

Question 1: Sentry & GDPR Issues

Current Sentry configuration violates GDPR.

Key problems:

- sendDefaultPii: true sends IP addresses without consent
- Session Replay records 10% of all sessions automatically
- No consent check before initialization
- Missing from Privacy Policy

Three solution options:

- Consent-based: Require analytics consent before loading Sentry (strictest)
- Legitimate interest: Justify basic error monitoring, disable intrusive features (practical)
- Hybrid: Basic errors always, enhanced features require consent (recommended)

## Server-Side Cookie Access

Future needs (GDPR module):

- Consent logging API needs to read consent state
- Newsletter API needs to validate marketing consent
- Data deletion requests need consent verification
- Server-side analytics (if implemented) needs consent checks

## How the GDPR Module Overlaps with Existing Cookie Consent

### Key Overlaps Identified

#### 1. Consent Collection Mechanism

- **Existing:** Cookie consent modal collects preferences for cookies (necessary, analytics, advertising, functional)
- **GDPR Addition:** Form-level consent checkboxes for data processing (contact forms, newsletter, downloads)
- **Integration:** Both use similar checkbox patterns but serve different purposes - cookies vs. data processing

#### 2. Consent Storage

- **Existing:** `consent_*` cookies stored client-side + `COOKIE_MODAL_VISIBLE` in localStorage
- **GDPR Addition:** Server-side consent log with audit trail (timestamps, IP addresses, purposes)
- **Integration:** Extend existing cookie consent to include server-side logging for compliance

#### 3. Enforcement Gap

- **Existing:** Cookie consent is collected but **not enforced** - analytics/advertising scripts load regardless
- **GDPR Requirement:** Scripts must NOT load until explicit consent is granted
- **Solution:** Fill in the placeholder methods (`enableAnalytics()`, `disableAnalytics()`, etc.) with actual script injection/blocking

#### 4. Shared Infrastructure

Both systems need:

- Consent logging API
- Privacy policy links
- User preference management
- Audit trails

**Integration:** Create shared utilities in `src/lib/gdpr/` that both systems can use

#### 5. Double System Consolidation

- **Current Issue:** Two separate cookie storage systems:
  - Individual `consent_*` cookies (4 separate)
  - Single `webstack-cookie-consent` JSON cookie
- **GDPR Fix:** Consolidate to single source of truth (recommend keeping `consent_*` cookies as they're already referenced)

---

## New Components Needed

1. **`<GDPRConsent />`** - Reusable consent checkbox for forms (doesn't exist)
2. **Double Opt-In Flow** - Newsletter confirmation email system (doesn't exist)
3. **Data Request Form** - Right to erasure/access handling (doesn't exist)
4. **Consent Logging API** - Server-side audit trail (doesn't exist)
5. **Script Blocking Enforcement** - Actually prevent cookies until consent (currently just placeholders)

---

## Implementation Approach

The plan treats the existing cookie consent as the **foundation** and adds:

- Form-level consent for data collection
- Server-side consent logging
- Double opt-in for newsletter
- Data subject rights handling
- Actual enforcement of cookie blocking

**Timeline:** 6-8 weeks for full GDPR compliance implementation.

---

## Proposed Component Structure

```
src/components/GDPR/
├── Consent/
│   ├── index.astro              # Reusable consent checkbox component
│   ├── client.ts                # Client-side consent validation
│   ├── server.ts                # Server-side consent utilities
│   └── __tests__/
├── ConsentLog/
│   ├── logger.ts                # Consent logging utilities
│   └── __tests__/
├── DataSubjectRequest/
│   ├── index.astro              # Form for GDPR requests (access, delete, etc.)
│   ├── client.ts                # Client-side form handling
│   └── __tests__/
└── PrivacyNotice/
    ├── index.astro              # Inline privacy notice component
    ├── server.ts                # Privacy text utilities
    └── __tests__/
```

---

## Integration Points

### Contact Form

**File:** `src/components/ContactForm/index.astro`

**Changes Required:**

1. Add `<GDPRConsent />` component before submit button
2. Add data retention notice: "We retain your inquiry for 2 years"
3. Update API endpoint to log consent
4. Add consent timestamp to submitted data

**Example:**

```astro
<!-- Add before submit button -->
<div class="mt-6 border-t border-[var(--color-border)] pt-6">
  <h3 class="text-lg font-semibold text-[var(--color-text)] mb-4">
    Privacy & Consent
  </h3>

  <GDPRConsent
    purposes={['contact']}
    required={true}
  />

  <p class="text-sm text-[var(--color-text-offset)] mt-4">
    <strong>Data Retention:</strong> We will retain your inquiry and contact information
    for up to 2 years to follow up on your request and improve our services.
    You can request deletion at any time by contacting privacy@webstackbuilders.com.
  </p>
</div>
```

### Newsletter

**File:** `src/components/CallToAction/Newsletter/index.astro`

**Changes Required:**

1. Add consent checkbox
2. Implement double opt-in flow
3. Send confirmation email
4. Create confirmation page

**Flow:**

1. User submits email + consent checkbox
2. API creates "pending" subscription in ConvertKit
3. Send confirmation email with unique token
4. User clicks link: `/newsletter/confirm?token=xxx`
5. Token verified → Subscribe as "active" in ConvertKit
6. Log confirmed consent

### Cookie Consent Enhancement

**File:** `src/components/Cookies/Customize/client.ts`

**Changes Required:**

Implement actual blocking in placeholder methods:

```typescript
private enableAnalytics(): void {
  // Check if analytics already loaded
  if (window.gtag) return

  // Dynamically inject Google Analytics
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script.async = true
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function() { dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID)
}

private disableAnalytics(): void {
  // Set Google Analytics opt-out
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true

  // Clear existing cookies
  document.cookie = '_ga=; Max-Age=0; path=/'
  document.cookie = '_gid=; Max-Age=0; path=/'
  document.cookie = '_gat=; Max-Age=0; path=/'
}
```

---

## API Endpoints

```
api/
├── gdpr/
│   ├── consent-log/  # New: Log all consents
│   ├── data-request/ # New: Handle GDPR requests
│   └── unsubscribe/  # New: Newsletter unsubscribe
├── contact/          # Existing: Enhanced with consent
└── newsletter/       # Existing: Enhanced with double opt-in
```

---

## Consent Record Schema

```typescript
interface ConsentRecord {
  id: string                    // UUID
  email: string                 // User identifier
  purposes: string[]            // ['marketing', 'analytics', etc.]
  consentGiven: boolean         // true/false
  timestamp: Date               // ISO 8601 timestamp
  ipAddress: string             // For verification
  userAgent: string             // Browser info
  source: string                // 'contact_form', 'newsletter', 'cookie_banner'
  version: string               // Privacy policy version at time of consent
  metadata?: Record<string, any> // Additional context
}
```

---

## GDPR User Rights to Implement

- **Right to Access:** Users can request their data
- **Right to Rectification:** Users can correct their data
- **Right to Erasure ("Right to be Forgotten"):** Users can request deletion
- **Right to Restrict Processing:** Users can limit how data is used
- **Right to Data Portability:** Users can export their data
- **Right to Object:** Users can object to processing

**Implementation:** Create data request form at `/privacy/data-request`

---

## Testing Checklist

### Consent Collection

- [ ] Contact form requires consent checkbox before submission
- [ ] Newsletter requires consent checkbox before subscription
- [ ] Consent checkboxes cannot be pre-checked
- [ ] Form validation blocks submission without consent
- [ ] Consent is logged with timestamp and IP

### Double Opt-In

- [ ] Newsletter sends confirmation email
- [ ] Confirmation link works within 24 hours
- [ ] Expired tokens are rejected
- [ ] Already-confirmed tokens handled gracefully
- [ ] Unconfirmed subscriptions don't receive emails

### Data Deletion

- [ ] Data request form sends verification email
- [ ] Deletion removes data from all systems
- [ ] Deletion confirmation sent to user
- [ ] Audit trail maintained (hashed email)
- [ ] Re-subscription allowed after deletion

### Cookie Blocking

- [ ] Analytics scripts don't load without consent
- [ ] Advertising scripts don't load without consent
- [ ] Consent change triggers immediate effect
- [ ] Cookie deletion works correctly
- [ ] Functional cookies still work when others blocked

---

## References

- Full implementation plan: `/docs/GDPR_COMPLIANCE_PLAN.md`
- Cookie consent overview: `/src/components/Cookies/OVERVIEW.md`
- GDPR regulations: https://gdpr-info.eu/
- ConvertKit GDPR: https://help.convertkit.com/en/articles/2502591-gdpr-and-convertkit
