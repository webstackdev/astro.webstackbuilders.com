# GDPR Compliance Implementation Plan - Updated

**Status:** Ready to begin implementation
**Last Updated:** October 20, 2025
**State Management Refactor:** ✅ Complete

---

## Executive Summary

This plan outlines the implementation of comprehensive GDPR compliance features, building on the completed centralized state management system. The foundation for consent tracking and enforcement is now in place through the `@components/Scripts/state` system with Nanostores.

---

## ✅ Completed Foundation Work

### State Management Refactoring (Weeks 1-4)

**Completed Components:**
1. **Centralized State System** (`src/components/Scripts/state/`)
   - ✅ Nanostore-based reactive state management
   - ✅ Single source of truth for all client-side state
   - ✅ Cookie-backed consent storage (GDPR compliant)
   - ✅ Automatic side effects for state changes
   - ✅ 100% test coverage (925/925 tests passing)

2. **Consent Management**
   - ✅ `$consent` store with 4 categories (necessary, analytics, advertising, functional)
   - ✅ Computed stores: `$hasAnalyticsConsent`, `$hasAdvertisingConsent`, `$hasFunctionalConsent`
   - ✅ `updateConsent()` action for managing consent changes
   - ✅ `initConsentFromCookies()` for hydration from cookie storage
   - ✅ Automatic localStorage sync with consent gating

3. **Cookie System**
   - ✅ Cookie modal (`src/components/Cookies/Consent/`)
   - ✅ Cookie preferences center (`src/components/Cookies/Customize/`)
   - ✅ Cookie utilities (`getCookie()`, `setCookie()`, `removeCookie()`)
   - ✅ Cookie persistence with proper encoding/decoding

4. **Script Loader with Consent Enforcement**
   - ✅ LoadableScript pattern for all client scripts
   - ✅ Consent-gated execution (`eventType: 'consent-gated'`)
   - ✅ Automatic script reload on consent changes
   - ✅ Subscription-based consent monitoring
   - ✅ Scripts unload when consent is withdrawn

5. **Privacy Infrastructure**
   - ✅ Privacy Policy page updated with DPO contact
   - ✅ Sentry DPA signed and documented
   - ✅ Error monitoring configured for GDPR (no IP addresses, no replay, no tracing)
   - ✅ Data Protection Officer defined in `src/content/company.ts`

### Key Architecture Decisions

**State Storage Strategy:**
- **Consent:** Cookies (required for cross-session, GDPR-compliant storage)
- **Theme:** localStorage (with functional consent gate)
- **Mastodon instances:** localStorage (with functional consent gate)
- **Embed cache:** Session-only (requires functional consent)

**Consent Enforcement:**
- Scripts declare required consent via `ConsentMetadata`
- Loader automatically enforces consent requirements
- Scripts are loaded/unloaded based on consent state changes
- Side effects manage cleanup when consent is withdrawn

---

## 🎯 Implementation Phases

### Phase 1: GDPR Consent Component (Week 5)

**Objective:** Create reusable form consent component for data collection

**New Files:**
```
src/components/GDPR/
├── Consent/
│   ├── index.astro              # Consent checkbox component
│   ├── client.ts                # Validation logic
│   ├── state.ts                 # Form consent state (separate from cookie consent)
│   ├── selectors.ts             # DOM selectors
│   └── __tests__/
│       ├── client.spec.ts
│       └── state.spec.ts
└── PrivacyNotice/
    ├── index.astro              # Inline privacy notice
    └── __tests__/
```

**Component Interface:**
```typescript
interface GDPRConsentProps {
  // Data processing purposes
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>

  // Required field?
  required?: boolean

  // Custom text overrides
  customText?: string

  // Links to policies
  privacyPolicyUrl?: string  // Default: '/privacy/'
  cookiePolicyUrl?: string   // Default: '/cookies/'

  // Form integration
  name?: string              // Default: 'gdpr_consent'
  id?: string                // Default: 'gdpr-consent'
}
```

**Usage Example:**
```astro
---
import GDPRConsent from '@components/GDPR/Consent/index.astro'
---

<form>
  <!-- Form fields -->

  <GDPRConsent
    purposes={['contact', 'marketing']}
    required={true}
  />

  <button type="submit">Submit</button>
</form>
```

**Generated HTML:**
```html
<div class="gdpr-consent" data-component="gdpr-consent">
  <label class="gdpr-consent__label">
    <input
      type="checkbox"
      name="gdpr_consent"
      id="gdpr-consent"
      required
      aria-required="true"
      aria-describedby="gdpr-consent-description"
      class="gdpr-consent__checkbox"
    />
    <span id="gdpr-consent-description" class="gdpr-consent__text">
      I consent to Webstack Builders processing my personal data for:
      <ul class="gdpr-consent__purposes">
        <li>Responding to my inquiry</li>
        <li>Sending marketing communications (unsubscribe anytime)</li>
      </ul>
      See our <a href="/privacy/">Privacy Policy</a> and
      <a href="/cookies/">Cookie Policy</a>.
    </span>
  </label>
  <div class="gdpr-consent__error" role="alert" aria-live="polite"></div>
</div>
```

**State Management:**
```typescript
// src/components/GDPR/Consent/state.ts
import { atom } from 'nanostores'

/**
 * Form consent state (separate from cookie consent in @components/Scripts/state)
 * Tracks explicit consent given in forms
 */
export interface FormConsentState {
  purposes: string[]
  timestamp: string
  validated: boolean
}

export const $formConsent = atom<FormConsentState | null>(null)

/**
 * Update form consent when checkbox is checked
 */
export function recordFormConsent(purposes: string[]): void {
  $formConsent.set({
    purposes,
    timestamp: new Date().toISOString(),
    validated: true
  })
}

/**
 * Clear form consent
 */
export function clearFormConsent(): void {
  $formConsent.set(null)
}
```

**Testing Strategy:**
- ✅ Renders with correct purposes
- ✅ Validates required checkbox
- ✅ Accessible (ARIA labels, keyboard navigation)
- ✅ Records consent state
- ✅ Links work correctly
- ✅ Error messages display properly

**Deliverables:**
- [ ] `GDPRConsent` component with full functionality
- [ ] Unit tests (minimum 10 tests)
- [ ] Integration with centralized state
- [ ] Accessibility audit passing
- [ ] Documentation in component README

---

### Phase 2: Contact Form Enhancement (Week 5)

**Objective:** Add GDPR consent and data retention notices to contact form

**File Updates:**
```
src/components/ContactForm/
├── index.astro              # Update with GDPRConsent
├── client.ts                # Update validation
└── __tests__/
    └── client.spec.ts       # Update tests

api/contact/
├── contact.ts               # Update to log consent
└── types.ts                 # Add consent fields
```

**Contact Form Changes:**

```astro
---
// src/components/ContactForm/index.astro
import GDPRConsent from '@components/GDPR/Consent/index.astro'
---

<form id="contact-form" method="post">
  <!-- Existing fields: name, email, company, phone, message, file upload -->

  <!-- NEW: Privacy & Consent Section -->
  <div class="contact-form__privacy">
    <h3>Privacy & Consent</h3>

    <GDPRConsent
      purposes={['contact']}
      required={true}
    />

    <!-- Optional marketing opt-in -->
    <label class="contact-form__marketing-opt-in">
      <input
        type="checkbox"
        name="marketing_consent"
        id="marketing-consent"
      />
      <span>
        I'd like to receive occasional updates about Webstack Builders services
        and web development insights (unsubscribe anytime)
      </span>
    </label>

    <!-- Data retention notice -->
    <div class="contact-form__retention-notice">
      <strong>Data Retention:</strong>
      We retain contact inquiries for 2 years for follow-up and service improvement.
      You can request deletion anytime by contacting our
      <a href="mailto:kevin@webstackbuilders.com">Data Protection Officer</a>.
    </div>
  </div>

  <button type="submit">Send Message</button>
</form>
```

**API Updates:**

```typescript
// api/contact/types.ts
export interface ContactFormData {
  // Existing fields
  name: string
  email: string
  company?: string
  phone?: string
  message: string
  files?: File[]

  // NEW: GDPR fields
  gdpr_consent: boolean
  gdpr_purposes: string[]
  marketing_consent: boolean
  consent_timestamp: string

  // Metadata for consent logging
  user_agent: string
  consent_ip?: string  // Optional, only if needed for fraud prevention
}

export interface ConsentLog {
  email: string
  purposes: string[]
  marketing_opted_in: boolean
  timestamp: string
  source: 'contact_form'
  user_agent: string
  ip_address?: string
  privacy_policy_version: string
}
```

```typescript
// api/contact/contact.ts
import { recordConsent } from '@lib/gdpr/consent-log'

export async function handleContactSubmission(data: ContactFormData) {
  // Validate GDPR consent
  if (!data.gdpr_consent) {
    throw new Error('GDPR consent is required')
  }

  // Log consent (GDPR audit trail requirement)
  await recordConsent({
    email: data.email,
    purposes: data.gdpr_purposes,
    marketing_opted_in: data.marketing_consent,
    timestamp: data.consent_timestamp,
    source: 'contact_form',
    user_agent: data.user_agent,
    privacy_policy_version: '2025-10-20'  // Track policy version
  })

  // Process contact form (existing logic)
  await processContactInquiry(data)

  // If marketing consent given, add to newsletter
  if (data.marketing_consent) {
    await addToNewsletterList({
      email: data.email,
      firstName: data.name.split(' ')[0],
      source: 'contact_form',
      doubleOptIn: false  // Already explicitly consented
    })
  }
}
```

**Testing Updates:**
- [ ] GDPR consent validation
- [ ] Marketing opt-in separate from required consent
- [ ] Data retention notice visible
- [ ] Consent logged before form submission
- [ ] Form submission blocked without consent
- [ ] Accessibility maintained

**Deliverables:**
- [ ] Updated contact form with GDPR consent
- [ ] API consent logging implemented
- [ ] Tests updated and passing
- [ ] Marketing opt-in integration with newsletter

---

### Phase 3: Newsletter Double Opt-In (Week 6)

**Objective:** Implement GDPR-compliant double opt-in for newsletter subscriptions

**Current Issue:**
- Newsletter directly subscribes via ConvertKit without confirmation
- No explicit consent checkbox
- No unsubscribe mechanism visible

**Solution:** Two-step confirmation flow

**New Files:**
```
src/pages/newsletter/
├── confirm.astro            # Email confirmation page
└── unsubscribe.astro        # Unsubscribe page

src/lib/newsletter/
├── token.ts                 # Token generation/validation
├── pending.ts               # Pending subscription storage
└── __tests__/

api/newsletter/
├── confirm/
│   └── index.ts             # Confirm subscription endpoint
└── unsubscribe/
    └── index.ts             # Unsubscribe endpoint
```

**Flow:**

1. **User Submits Email** → Newsletter form with consent checkbox
2. **Generate Token** → Create unique confirmation token (24hr expiry)
3. **Send Email** → Confirmation email with link
4. **User Clicks Link** → `/newsletter/confirm?token=xxx`
5. **Validate Token** → Verify token and activate subscription
6. **Log Consent** → Record confirmed consent in audit trail
7. **Subscribe** → Add to ConvertKit as active subscriber

**Newsletter Form Updates:**

```astro
---
// src/components/CallToAction/Newsletter/index.astro
import GDPRConsent from '@components/GDPR/Consent/index.astro'
---

<form id="newsletter-form" method="post">
  <input
    type="email"
    name="email"
    placeholder="your@email.com"
    required
  />

  <input
    type="text"
    name="firstName"
    placeholder="First name (optional)"
  />

  <!-- NEW: GDPR consent -->
  <div class="newsletter__consent">
    <GDPRConsent
      purposes={['marketing']}
      required={true}
      customText="I consent to receive marketing emails from Webstack Builders. Unsubscribe anytime."
    />
  </div>

  <button type="submit">Subscribe</button>

  <!-- NEW: Privacy notice -->
  <p class="newsletter__privacy-notice">
    By subscribing, you'll receive our newsletter about web development insights
    and Webstack Builders updates. We'll send a confirmation email first.
    <a href="/privacy/">Privacy Policy</a>
  </p>
</form>
```

**Token System:**

```typescript
// src/lib/newsletter/token.ts
import { randomBytes } from 'crypto'

export interface PendingSubscription {
  email: string
  firstName?: string
  token: string
  createdAt: Date
  expiresAt: Date  // 24 hours from creation
  consentTimestamp: string
  userAgent: string
  verified: boolean
}

/**
 * Generate cryptographically secure token
 */
export function generateConfirmationToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Store pending subscription (in-memory or database)
 */
export async function createPendingSubscription(
  email: string,
  firstName?: string
): Promise<string> {
  const token = generateConfirmationToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

  const pending: PendingSubscription = {
    email,
    firstName,
    token,
    createdAt: now,
    expiresAt,
    consentTimestamp: now.toISOString(),
    userAgent: '', // Set from request
    verified: false
  }

  // Store in database or memory cache
  await storePending(pending)

  return token
}

/**
 * Validate and consume token
 */
export async function validateToken(token: string): Promise<PendingSubscription | null> {
  const pending = await getPending(token)

  if (!pending) return null
  if (pending.verified) return null // Already used
  if (new Date() > pending.expiresAt) return null // Expired

  // Mark as verified
  pending.verified = true
  await updatePending(pending)

  return pending
}
```

**Confirmation Email:**

```typescript
// api/newsletter/newsletter.ts
async function sendConfirmationEmail(email: string, token: string) {
  const confirmUrl = `https://webstackbuilders.com/newsletter/confirm?token=${token}`

  await sendEmail({
    to: email,
    from: 'hello@webstackbuilders.com',
    subject: 'Confirm your Webstack Builders newsletter subscription',
    html: `
      <h2>Confirm Your Subscription</h2>
      <p>Thanks for subscribing to Webstack Builders insights!</p>
      <p>
        Please confirm your email address by clicking the button below.
        This link expires in 24 hours.
      </p>
      <a href="${confirmUrl}" style="...">Confirm Subscription</a>
      <p>
        If you didn't request this, simply ignore this email.
      </p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        Webstack Builders | Portland, Oregon<br>
        <a href="https://webstackbuilders.com/newsletter/unsubscribe?email=${email}">
          Unsubscribe
        </a> |
        <a href="https://webstackbuilders.com/privacy/">Privacy Policy</a>
      </p>
    `
  })
}
```

**Confirmation Page:**

```astro
---
// src/pages/newsletter/confirm.astro
import BaseLayout from '@layouts/BaseLayout.astro'
import { validateToken } from '@lib/newsletter/token'
import { subscribeToNewsletter } from '@lib/newsletter/convertkit'
import { recordConsent } from '@lib/gdpr/consent-log'

const token = Astro.url.searchParams.get('token')
const pending = token ? await validateToken(token) : null

let success = false
let error = null

if (pending) {
  try {
    // Subscribe to ConvertKit
    await subscribeToNewsletter({
      email: pending.email,
      firstName: pending.firstName,
      status: 'active'  // Already confirmed
    })

    // Log confirmed consent
    await recordConsent({
      email: pending.email,
      purposes: ['marketing'],
      marketing_opted_in: true,
      timestamp: pending.consentTimestamp,
      confirmed_at: new Date().toISOString(),
      source: 'newsletter_double_opt_in',
      user_agent: pending.userAgent,
      privacy_policy_version: '2025-10-20'
    })

    success = true
  } catch (e) {
    error = 'Failed to complete subscription'
  }
}
---

<BaseLayout pageTitle="Newsletter Confirmation" path="/newsletter/confirm/">
  <div class="max-w-2xl mx-auto px-4 py-12 text-center">
    {success && (
      <div class="success-message">
        <h1>✅ Subscription Confirmed!</h1>
        <p>
          Thanks for confirming! You'll receive our next newsletter soon.
        </p>
        <p>
          <a href="/">Return to homepage</a>
        </p>
      </div>
    )}

    {error && (
      <div class="error-message">
        <h1>❌ Confirmation Failed</h1>
        <p>{error}</p>
        <p>
          The link may have expired or already been used.
          <a href="/">Try subscribing again</a>
        </p>
      </div>
    )}

    {!token && (
      <div class="error-message">
        <h1>Invalid Link</h1>
        <p>
          This confirmation link is invalid.
          <a href="/">Return to homepage</a>
        </p>
      </div>
    )}
  </div>
</BaseLayout>
```

**Testing:**
- [ ] Token generation and validation
- [ ] Email sending
- [ ] Expiration handling (24 hours)
- [ ] Double-use prevention
- [ ] ConvertKit integration
- [ ] Consent logging
- [ ] Error handling

**Deliverables:**
- [ ] Double opt-in flow complete
- [ ] Confirmation email template
- [ ] Confirmation and unsubscribe pages
- [ ] Token system with security
- [ ] Tests for all flows
- [ ] Integration with ConvertKit

---

### Phase 4: Consent Audit Trail (Week 6)

**Objective:** Maintain GDPR-compliant records of all consent events

**New Files:**
```
src/lib/gdpr/
├── consent-log.ts           # Consent logging utilities
├── types.ts                 # TypeScript interfaces
└── __tests__/

api/gdpr/
├── consent-log/
│   └── index.ts             # API endpoint for logging
└── data-request/
    └── index.ts             # GDPR data requests

docs/
└── CONSENT_LOGGING.md       # Documentation
```

**Schema:**

```typescript
// src/lib/gdpr/types.ts

export interface ConsentRecord {
  id: string                    // UUID
  email: string                 // User identifier
  purposes: ConsentPurpose[]    // What they consented to
  marketing_opted_in: boolean   // Separate marketing flag
  consent_given: boolean        // true = granted, false = withdrawn
  timestamp: string             // When consent was given/withdrawn
  confirmed_at?: string         // For double opt-in
  source: ConsentSource         // Where consent came from
  user_agent: string            // Browser info
  ip_address?: string           // Optional, only if needed for fraud
  privacy_policy_version: string // Policy version at consent time
  metadata?: Record<string, any> // Additional context
}

export type ConsentPurpose =
  | 'necessary'   // Essential site functionality (always true)
  | 'functional'  // Enhanced features (theme, preferences)
  | 'analytics'   // Usage tracking
  | 'advertising' // Marketing cookies/tracking
  | 'contact'     // Processing contact form data
  | 'marketing'   // Email marketing communications
  | 'downloads'   // Gated content access

export type ConsentSource =
  | 'cookie_banner'
  | 'cookie_preferences'
  | 'contact_form'
  | 'newsletter_single_opt_in'
  | 'newsletter_double_opt_in'
  | 'download_gate'
  | 'account_registration'
  | 'withdrawal'  // When user withdraws consent
```

**Storage Options:**

**Option A: JSON File Log (MVP/Development)**
```typescript
// src/lib/gdpr/consent-log.ts
import { writeFile, appendFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

const LOG_FILE = '.consent-logs/consent-records.jsonl'  // .gitignored

export async function recordConsent(record: Omit<ConsentRecord, 'id'>): Promise<string> {
  const id = uuidv4()
  const fullRecord: ConsentRecord = { id, ...record }

  // Append as JSON Lines (one record per line)
  const line = JSON.stringify(fullRecord) + '\n'
  await appendFile(LOG_FILE, line)

  return id
}

export async function getConsentHistory(email: string): Promise<ConsentRecord[]> {
  const content = await readFile(LOG_FILE, 'utf-8')
  const records = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as ConsentRecord)
    .filter(record => record.email === email)

  return records
}
```

**Option B: Database (Production)**
```sql
-- PostgreSQL schema
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  purposes TEXT[] NOT NULL,
  marketing_opted_in BOOLEAN NOT NULL,
  consent_given BOOLEAN NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  source VARCHAR(50) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),  -- IPv6 support
  privacy_policy_version VARCHAR(20) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consent_email ON consent_records(email);
CREATE INDEX idx_consent_timestamp ON consent_records(timestamp);
CREATE INDEX idx_consent_source ON consent_records(source);
```

**Logging Utility:**

```typescript
// src/lib/gdpr/consent-log.ts
import type { ConsentRecord } from './types'

/**
 * Record a consent event in the audit trail
 * Required by GDPR Article 7(1) - demonstrable consent
 */
export async function recordConsent(
  record: Omit<ConsentRecord, 'id'>
): Promise<string> {
  // Validate record
  if (!record.email || !record.timestamp) {
    throw new Error('Email and timestamp are required')
  }

  if (record.purposes.length === 0) {
    throw new Error('At least one purpose must be specified')
  }

  // Store in database or log file
  const id = await storeConsentRecord(record)

  // Optional: Send to audit service (Sentry, CloudWatch, etc.)
  if (import.meta.env.PROD) {
    await sendToAuditService(record)
  }

  return id
}

/**
 * Get consent history for a specific email
 * Required for GDPR Article 15 - Right of access
 */
export async function getConsentHistory(email: string): Promise<ConsentRecord[]> {
  return await fetchConsentRecords(email)
}

/**
 * Record consent withdrawal
 * Required for GDPR Article 7(3) - Easy withdrawal
 */
export async function recordConsentWithdrawal(
  email: string,
  purposes: ConsentPurpose[]
): Promise<string> {
  return await recordConsent({
    email,
    purposes,
    marketing_opted_in: false,
    consent_given: false,
    timestamp: new Date().toISOString(),
    source: 'withdrawal',
    user_agent: navigator.userAgent,
    privacy_policy_version: CURRENT_PRIVACY_VERSION
  })
}
```

**Integration Points:**

Update all consent collection points to log:

```typescript
// Contact form submission
await recordConsent({
  email: formData.email,
  purposes: ['contact'],
  marketing_opted_in: formData.marketing_consent,
  consent_given: true,
  timestamp: new Date().toISOString(),
  source: 'contact_form',
  user_agent: request.headers['user-agent'],
  privacy_policy_version: '2025-10-20'
})

// Newsletter subscription confirmation
await recordConsent({
  email: pending.email,
  purposes: ['marketing'],
  marketing_opted_in: true,
  consent_given: true,
  timestamp: pending.consentTimestamp,
  confirmed_at: new Date().toISOString(),
  source: 'newsletter_double_opt_in',
  user_agent: pending.userAgent,
  privacy_policy_version: '2025-10-20'
})

// Cookie consent changes
$consent.subscribe((state) => {
  const changedCategories = getChangedCategories(state)
  if (changedCategories.length > 0) {
    recordConsent({
      email: getUserEmail(), // If logged in
      purposes: changedCategories,
      marketing_opted_in: false,
      consent_given: true,
      timestamp: new Date().toISOString(),
      source: 'cookie_preferences',
      user_agent: navigator.userAgent,
      privacy_policy_version: '2025-10-20'
    })
  }
})
```

**Testing:**
- [ ] Consent logging for all sources
- [ ] Consent history retrieval
- [ ] Withdrawal recording
- [ ] Data validation
- [ ] Storage mechanisms (file and DB)
- [ ] Integration with existing flows

**Deliverables:**
- [ ] Consent logging system
- [ ] Database schema (or file structure)
- [ ] Integration with all consent points
- [ ] Tests for logging and retrieval
- [ ] Documentation

---

### Phase 5: GDPR Data Subject Rights (Week 7)

**Objective:** Implement user data access, export, and deletion requests

**New Files:**
```
src/pages/privacy/
├── data-request.astro       # GDPR request form
└── data-request-success.astro

src/components/GDPR/
└── DataSubjectRequest/
    ├── index.astro
    ├── client.ts
    └── __tests__/

api/gdpr/
├── data-request/
│   └── index.ts             # Handle GDPR requests
└── data-export/
    └── index.ts             # Generate data export

src/lib/gdpr/
├── data-export.ts           # Export user data
├── data-deletion.ts         # Delete user data
└── data-access.ts           # Retrieve user data
```

**GDPR Data Request Form:**

```astro
---
// src/pages/privacy/data-request.astro
import BaseLayout from '@layouts/BaseLayout.astro'
import company from '@content/company'
---

<BaseLayout pageTitle="GDPR Data Request" path="/privacy/data-request/">
  <div class="max-w-2xl mx-auto px-4 py-12">
    <h1>Your Data Rights</h1>
    <p>
      Under GDPR, you have rights regarding your personal data.
      Use this form to exercise these rights.
    </p>

    <form id="data-request-form" method="post" action="/api/gdpr/data-request">
      <!-- Email (for identification) -->
      <label>
        <span>Your Email Address:</span>
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
        />
        <small>The email address associated with your data</small>
      </label>

      <!-- Request Type -->
      <label>
        <span>Request Type:</span>
        <select name="request_type" required>
          <option value="">Select a request type</option>
          <option value="access">
            Right to Access - Get a copy of my data
          </option>
          <option value="rectification">
            Right to Rectification - Correct my data
          </option>
          <option value="erasure">
            Right to Erasure - Delete my data
          </option>
          <option value="portability">
            Right to Portability - Export my data
          </option>
          <option value="objection">
            Right to Object - Stop processing my data
          </option>
          <option value="restriction">
            Right to Restriction - Limit use of my data
          </option>
        </select>
      </label>

      <!-- Additional Details -->
      <label>
        <span>Additional Information (optional):</span>
        <textarea
          name="details"
          rows="4"
          placeholder="Provide any additional context for your request..."
        ></textarea>
      </label>

      <!-- Identity Verification Note -->
      <div class="notice">
        <strong>📋 Note:</strong>
        We may contact you to verify your identity before processing this request.
        This is required by GDPR to protect your data.
      </div>

      <button type="submit">Submit Request</button>
    </form>

    <!-- Response Time Notice -->
    <div class="info-box">
      <h3>What Happens Next?</h3>
      <ul>
        <li>We'll send a confirmation email to verify your identity</li>
        <li>You'll receive a response within <strong>30 days</strong> as required by GDPR</li>
        <li>For complex requests, we may extend this by 2 months with notification</li>
      </ul>

      <h3>Contact Our DPO</h3>
      <p>
        For questions about data protection:
        <br>
        <strong>{company.dataProtectionOfficer.name}</strong>
        <br>
        <a href={`mailto:${company.dataProtectionOfficer.email}`}>
          {company.dataProtectionOfficer.email}
        </a>
      </p>
    </div>
  </div>
</BaseLayout>
```

**API Handler:**

```typescript
// api/gdpr/data-request/index.ts
import type { APIRoute } from 'astro'
import { recordDataRequest } from '@lib/gdpr/data-requests'
import { sendVerificationEmail } from '@lib/email/verification'

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const requestType = formData.get('request_type') as string
    const details = formData.get('details') as string

    // Validate
    if (!email || !requestType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email and request type are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate verification token
    const token = await createVerificationToken(email)

    // Store request (pending verification)
    const requestId = await recordDataRequest({
      email,
      requestType,
      details,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      verificationToken: token
    })

    // Send verification email
    await sendVerificationEmail({
      to: email,
      requestId,
      requestType,
      verificationUrl: `https://webstackbuilders.com/privacy/verify-request?token=${token}`
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      requestId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Data request error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

**Data Export Utility:**

```typescript
// src/lib/gdpr/data-export.ts

export interface UserDataExport {
  requestDate: string
  exportedAt: string
  email: string
  data: {
    contactInquiries: ContactInquiry[]
    newsletterSubscriptions: NewsletterSubscription[]
    consentRecords: ConsentRecord[]
    cookiePreferences: CookiePreferences
    fileUploads: FileUploadRecord[]
  }
}

/**
 * Generate complete data export for a user
 * Implements GDPR Article 15 (Right of Access) and Article 20 (Portability)
 */
export async function exportUserData(email: string): Promise<UserDataExport> {
  // Fetch all data associated with email
  const [
    contactInquiries,
    newsletterSubs,
    consentRecords,
    cookiePrefs,
    uploads
  ] = await Promise.all([
    getContactInquiries(email),
    getNewsletterSubscriptions(email),
    getConsentHistory(email),
    getCookiePreferences(email),
    getFileUploads(email)
  ])

  return {
    requestDate: new Date().toISOString(),
    exportedAt: new Date().toISOString(),
    email,
    data: {
      contactInquiries,
      newsletterSubscriptions: newsletterSubs,
      consentRecords,
      cookiePreferences: cookiePrefs,
      fileUploads: uploads
    }
  }
}

/**
 * Export data as JSON file
 */
export async function exportAsJSON(email: string): Promise<Blob> {
  const data = await exportUserData(email)
  const json = JSON.stringify(data, null, 2)
  return new Blob([json], { type: 'application/json' })
}

/**
 * Export data as CSV files (zipped)
 */
export async function exportAsCSV(email: string): Promise<Blob> {
  const data = await exportUserData(email)

  // Convert each data type to CSV
  const csvFiles = {
    'contact_inquiries.csv': convertToCSV(data.data.contactInquiries),
    'newsletter.csv': convertToCSV(data.data.newsletterSubscriptions),
    'consent_records.csv': convertToCSV(data.data.consentRecords),
    'file_uploads.csv': convertToCSV(data.data.fileUploads)
  }

  // Create ZIP file
  return await createZIP(csvFiles)
}
```

**Data Deletion Utility:**

```typescript
// src/lib/gdpr/data-deletion.ts

export interface DeletionReport {
  email: string
  deletedAt: string
  itemsDeleted: {
    contactInquiries: number
    newsletterSubscriptions: number
    fileUploads: number
    cookiePreferences: number
  }
  retainedItems: {
    consentRecords: number  // Must retain for compliance
    reason: string
  }
}

/**
 * Delete all user data (except legally required records)
 * Implements GDPR Article 17 (Right to Erasure)
 */
export async function deleteUserData(email: string): Promise<DeletionReport> {
  // Delete all personal data
  const deleted = await Promise.all([
    deleteContactInquiries(email),
    deleteNewsletterSubscriptions(email),
    deleteFileUploads(email),
    deleteCookiePreferences(email)
  ])

  // Do NOT delete consent records (required for legal compliance)
  const consentRecordsCount = await getConsentRecordCount(email)

  // Anonymize consent records (keep for audit, remove PII)
  await anonymizeConsentRecords(email)

  // Unsubscribe from ConvertKit
  await unsubscribeFromConvertKit(email)

  return {
    email,
    deletedAt: new Date().toISOString(),
    itemsDeleted: {
      contactInquiries: deleted[0],
      newsletterSubscriptions: deleted[1],
      fileUploads: deleted[2],
      cookiePreferences: deleted[3]
    },
    retainedItems: {
      consentRecords: consentRecordsCount,
      reason: 'Required by GDPR Article 7(1) - demonstrable consent records'
    }
  }
}
```

**Testing:**
- [ ] Data request form submission
- [ ] Email verification flow
- [ ] Data export (JSON and CSV)
- [ ] Data deletion
- [ ] Data anonymization
- [ ] 30-day response time tracking
- [ ] DPO notification

**Deliverables:**
- [ ] GDPR data request form and pages
- [ ] API endpoints for all request types
- [ ] Data export utilities (JSON/CSV)
- [ ] Data deletion with audit trail
- [ ] Verification email flow
- [ ] Tests for all functions
- [ ] Documentation

---

## 📊 Testing Strategy

### Unit Tests
- [ ] `GDPRConsent` component rendering and validation
- [ ] Form consent state management
- [ ] Token generation and validation
- [ ] Consent logging and retrieval
- [ ] Data export utilities
- [ ] Data deletion utilities

### Integration Tests
- [ ] Contact form with GDPR consent
- [ ] Newsletter double opt-in flow
- [ ] Consent audit trail logging
- [ ] Data request processing
- [ ] Email sending (mocked)

### E2E Tests (Playwright)
- [ ] User submits contact form with consent
- [ ] User subscribes to newsletter and confirms
- [ ] User requests data export
- [ ] User requests data deletion
- [ ] Cookie consent integration

### Accessibility Tests
- [ ] GDPR consent checkboxes keyboard accessible
- [ ] Forms have proper ARIA labels
- [ ] Error messages announced to screen readers
- [ ] Focus management in modals

---

## 📋 Compliance Checklist

### GDPR Articles Addressed

- [x] **Article 6** - Lawfulness of Processing
  - Cookie consent system for necessary, analytics, advertising, functional
  - Form consent for contact and marketing

- [ ] **Article 7** - Conditions for Consent
  - [ ] Clear affirmative action required (checkboxes, not pre-checked)
  - [ ] Easy to withdraw as to give
  - [ ] Demonstrable consent (audit trail)

- [ ] **Article 12** - Transparent Information
  - [x] Privacy Policy updated with DPO contact
  - [x] Clear language in consent forms
  - [ ] 30-day response time for requests

- [ ] **Article 13** - Information to be Provided
  - [ ] Purpose of data collection stated
  - [ ] Data retention periods disclosed
  - [ ] Right to withdraw consent mentioned

- [ ] **Article 15** - Right of Access
  - [ ] Data export functionality

- [ ] **Article 16** - Right to Rectification
  - [ ] Data correction requests

- [ ] **Article 17** - Right to Erasure
  - [ ] Data deletion functionality

- [ ] **Article 20** - Right to Data Portability
  - [ ] Data export in machine-readable formats (JSON, CSV)

- [ ] **Article 32** - Security of Processing
  - [x] SSL/TLS encryption
  - [x] Access controls
  - [ ] Secure token generation
  - [ ] Encrypted storage of sensitive data

---

## 🚀 Deployment Plan

### Phase 1 - Week 5
- Deploy `GDPRConsent` component
- Update contact form with GDPR consent
- Begin consent logging (file-based for MVP)

### Phase 2 - Week 6
- Deploy newsletter double opt-in
- Implement consent audit trail
- Database setup for production

### Phase 3 - Week 7
- Deploy GDPR data request forms
- Implement data export/deletion
- Full testing and QA

### Go-Live Checklist
- [ ] All consent forms deployed
- [ ] Audit trail logging active
- [ ] Data request system operational
- [ ] Privacy Policy updated
- [ ] DPO contact confirmed
- [ ] Staff trained on GDPR procedures
- [ ] Backup and recovery tested
- [ ] Security audit passed

---

## 📚 Documentation Requirements

### User-Facing
- [ ] Updated Privacy Policy
- [ ] Cookie Policy with consent instructions
- [ ] Data request form instructions
- [ ] Newsletter confirmation emails
- [ ] Unsubscribe process

### Developer
- [ ] GDPR component API documentation
- [ ] Consent logging guide
- [ ] Data export/deletion procedures
- [ ] Testing guidelines
- [ ] Deployment checklist

### Legal/Compliance
- [ ] Consent audit trail documentation
- [ ] Data retention policies
- [ ] DPA with third parties (Sentry, ConvertKit)
- [ ] Incident response procedures
- [ ] GDPR compliance report

---

## 🎯 Success Criteria

### Technical
- ✅ All tests passing (unit, integration, E2E)
- ✅ No accessibility violations
- ✅ Performance impact < 50ms
- ✅ Works in all supported browsers

### Compliance
- ✅ All GDPR requirements implemented
- ✅ Consent audit trail active
- ✅ 30-day response time achievable
- ✅ Legal review approved

### User Experience
- ✅ Clear consent language
- ✅ Minimal friction in forms
- ✅ Easy data request process
- ✅ Fast response times

---

## 📞 Support & Resources

### Internal Contacts
- **Data Protection Officer:** Kevin Brown (kevin@webstackbuilders.com)
- **Technical Lead:** [Name]
- **Legal Counsel:** [Contact if applicable]

### External Resources
- GDPR Official Text: https://gdpr-info.eu/
- ICO Guide: https://ico.org.uk/for-organisations/guide-to-data-protection/
- Sentry DPA: [Link to signed agreement]
- ConvertKit GDPR: https://help.convertkit.com/en/articles/2502494

### Tools & Services
- **Error Monitoring:** Sentry (DPA signed)
- **Email Marketing:** ConvertKit (GDPR compliant)
- **Email Sending:** [Service name]
- **Database:** [PostgreSQL/MySQL]
- **Hosting:** Vercel

---

## 🔄 Maintenance Plan

### Regular Reviews
- **Monthly:** Consent audit trail review
- **Quarterly:** Privacy Policy updates check
- **Annually:** Full GDPR compliance audit

### Monitoring
- Track data request response times
- Monitor consent withdrawal rates
- Alert on failed consent logging
- Review security incidents

### Updates
- Privacy Policy version tracking
- Consent form text updates
- Third-party DPA renewals
- Staff training refreshers

---

**Document Version:** 2.0
**Last Updated:** October 20, 2025
**Next Review:** November 2025
**Status:** Ready for Phase 1 implementation
