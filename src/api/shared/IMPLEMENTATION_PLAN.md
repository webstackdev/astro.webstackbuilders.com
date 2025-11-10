# GDPR Consent System - Implementation Plan

## Off-Topic Notes

We've refactored two components to be web components: Newsletter and ThemePicker.
We did a trial reactor of the Footer component to Preact.

## Quick Start

This plan reorganizes the REFACTOR.md document into a clear, step-by-step implementation guide.

**Implementation Strategy:**

- Work sequentially through phases
- Each phase builds on the previous
- Test thoroughly before moving forward
- Convert components to web components as we modify them (not as separate phase)

---

## Phase 0: Setup & Dependencies

### 0.1 Install Dependencies

```bash
npm install @supabase/supabase-js uuid @upstash/ratelimit nodemailer
npm install -D @types/uuid @types/nodemailer
```

### 0.2 Initialize Supabase

```bash
# Install Supabase CLI globally
npm install -g supabase

# Initialize in project (creates supabase/ directory)
supabase init

# Start local Supabase with Docker
supabase start
```

**Output will show:**

- API URL: `http://localhost:54321`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio URL: `http://localhost:54323`
- Keys: anon, service_role

### 0.3 Environment Variables

Create/update `.env`:

```bash
# Supabase (from supabase start output)
PUBLIC_SUPABASE_URL=http://localhost:54321  # Production: https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...         # Safe to expose (public)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...        # NEVER add PUBLIC_ prefix!

# Privacy Policy
PUBLIC_PRIVACY_POLICY_VERSION=2024-11-10

# Email Testing (Ethereal)
ETHEREAL_USER=your-username@ethereal.email
ETHEREAL_PASS=your-password

# Vercel Cron Jobs
CRON_SECRET=  # Generate with: openssl rand -base64 32

# Upstash (for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Generate CRON_SECRET:**

```bash
openssl rand -base64 32
```

### 0.4 Create Directory Structure

```bash
mkdir -p src/api/@types
mkdir -p src/pages/api/gdpr
mkdir -p src/pages/api/newsletter
mkdir -p src/pages/api/cron
mkdir -p src/lib/db
mkdir -p src/lib/rateLimit
mkdir -p test/helpers
```

---

## Phase 1: Database & Types

### 1.1 Create TypeScript Types

**File:** `src/api/@types/gdpr.ts`

```typescript
export interface ConsentRecord {
  id: string
  DataSubjectId: string
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  timestamp: string
  source: 'contact_form' | 'newsletter_form' | 'download_form' | 'cookies_modal' | 'preferences_page'
  userAgent: string
  ipAddress?: string
  privacyPolicyVersion: string
  consentText?: string
  verified: boolean
}

export interface ConsentRequest {
  DataSubjectId: string
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  source: string
  userAgent: string
  ipAddress?: string
  consentText?: string
  verified?: boolean
}

export interface ConsentResponse {
  success: true
  record: ConsentRecord
}

export interface ErrorResponse {
  success: false
  error: {
    code: 'INVALID_UUID' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'UNAUTHORIZED'
    message: string
  }
}
```

### 1.2 Create Database Migrations

**File:** `supabase/migrations/001_create_consent_records.sql`

```sql
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_subject_id UUID NOT NULL,
  email TEXT,
  purposes TEXT[] NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address INET,
  privacy_policy_version TEXT NOT NULL,
  consent_text TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consent_data_subject_id ON consent_records(data_subject_id);
CREATE INDEX idx_consent_email ON consent_records(email) WHERE email IS NOT NULL;
CREATE INDEX idx_consent_timestamp ON consent_records(timestamp DESC);

-- RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_access"
ON consent_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**File:** `supabase/migrations/002_create_newsletter_confirmations.sql`

```sql
CREATE TABLE newsletter_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  data_subject_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_token ON newsletter_confirmations(token);
CREATE INDEX idx_newsletter_expiry ON newsletter_confirmations(expires_at)
  WHERE confirmed_at IS NULL;

ALTER TABLE newsletter_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_access"
ON newsletter_confirmations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**File:** `supabase/migrations/003_create_dsar_requests.sql`

```sql
CREATE TABLE dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('ACCESS', 'DELETE')),
  expires_at TIMESTAMPTZ NOT NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dsar_token ON dsar_requests(token);
CREATE INDEX idx_dsar_expiry ON dsar_requests(expires_at)
  WHERE fulfilled_at IS NULL;

ALTER TABLE dsar_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_access"
ON dsar_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 1.3 Run Migrations Locally

```bash
supabase db push
```

### 1.4 Create Supabase Clients

**File:** `src/lib/db/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL!

// Admin client (server-side only, bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Public client (client-side, respects RLS)
export const supabasePublic = createClient(
  supabaseUrl,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
)
```

### 1.5 Test RLS Policies

Create test file: `src/lib/db/__tests__/rls.spec.ts`

Test scenarios:

- ✅ Service role can CRUD all records
- ❌ Public client cannot read any records
- ❌ Public client cannot insert records
- ❌ Public client cannot update records
- ❌ Public client cannot delete records

---

## Phase 2: DataSubjectId & Consent Store

### 2.1 Create UUID Helper

**File:** `src/lib/helpers/uuid.ts`

```typescript
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
```

### 2.2 Create DataSubjectId Management

**File:** `src/lib/helpers/dataSubjectId.ts`

```typescript
import { v4 as uuidv4 } from 'uuid'
import { isValidUUID } from './uuid'

export function getOrCreateDataSubjectId(): string {
  // Try localStorage first
  const storedId = localStorage.getItem('DataSubjectId')
  if (storedId && isValidUUID(storedId)) {
    syncToCookie(storedId)
    return storedId
  }

  // Try cookie as backup
  const cookieId = getCookieValue('DataSubjectId')
  if (cookieId && isValidUUID(cookieId)) {
    localStorage.setItem('DataSubjectId', cookieId)
    return cookieId
  }

  // Generate new ID
  const newId = uuidv4()
  localStorage.setItem('DataSubjectId', newId)
  syncToCookie(newId)

  return newId
}

export function deleteDataSubjectId(): void {
  localStorage.removeItem('DataSubjectId')
  document.cookie = 'DataSubjectId=; path=/; max-age=0'
}

function syncToCookie(dataSubjectId: string): void {
  const isProduction = window.location.protocol === 'https:'

  document.cookie = [
    `DataSubjectId=${dataSubjectId}`,
    'path=/',
    'max-age=31536000', // 1 year
    'SameSite=Strict',
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
```

### 2.3 Update Consent Store

**File:** `src/components/scripts/store/consent.ts`

Add to existing store:

```typescript
import { getOrCreateDataSubjectId, deleteDataSubjectId } from '@/lib/helpers/dataSubjectId'

// Add to store interface
export interface ConsentState {
  // ... existing fields
  DataSubjectId: string
}

// Initialize DataSubjectId in store
export const $consent = persistentMap<ConsentState>('consent:', {
  // ... existing defaults
  DataSubjectId: '', // Will be set on first access
})

// Initialize DataSubjectId on store mount
onMount($consent, () => {
  const currentId = $consent.get().DataSubjectId
  if (!currentId) {
    $consent.setKey('DataSubjectId', getOrCreateDataSubjectId())
  }
})
```

### 2.4 Update Side Effects

**File:** `src/components/scripts/bootstrap/consent/index.ts`

Add new side effect to `initConsentSideEffects()`:

```typescript
// Side Effect 5: Log consent changes to API
$consent.subscribe(async (consentState, oldConsentState) => {
  try {
    // Only log if purposes changed (not on initial load)
    if (!oldConsentState) return

    const DataSubjectId = getOrCreateDataSubjectId()

    await fetch('/api/gdpr/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        DataSubjectId,
        purposes: Object.keys(consentState).filter(key =>
          consentState[key] === true &&
          ['contact', 'marketing', 'analytics', 'downloads'].includes(key)
        ),
        source: 'cookies_modal',
        userAgent: navigator.userAgent,
        verified: false
      })
    })
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'cookieConsent',
      operation: 'logConsentToAPI'
    })
  }
})
```

Update `initStateSideEffects()` to delete DataSubjectId:

```typescript
$hasFunctionalConsent.subscribe((hasConsent) => {
  if (!hasConsent) {
    try {
      // Existing localStorage clearing...

      // NEW: Delete DataSubjectId
      deleteDataSubjectId()
    } catch (error) {
      // ... existing error handling
    }
  }
})
```

### 2.5 Convert Consent Modal to Web Component

**Action:** Convert `src/components/Cookies/Modal.astro` to web component following ThemePicker pattern

Key changes:

- Extract to standalone web component
- Use `transition:persist` on the custom element itself
- Subscribe to consent store
- Handle View Transitions events

### 2.6 Convert Consent Preferences to Web Component

**Action:** Convert consent preferences component to web component

### 2.7 Test DataSubjectId Persistence

**File:** `src/lib/helpers/__tests__/dataSubjectId.spec.ts`

```typescript
import {
  useTestStorageEngine,
  setTestStorageKey,
  cleanTestStorage,
  getTestStorage,
} from '@nanostores/persistent'
import { getOrCreateDataSubjectId, deleteDataSubjectId } from '../dataSubjectId'

beforeAll(() => {
  useTestStorageEngine()
})

afterEach(() => {
  cleanTestStorage()
})

it('creates new UUID if none exists', () => {
  const id = getOrCreateDataSubjectId()
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  expect(getTestStorage()).toHaveProperty('DataSubjectId', id)
})

it('retrieves existing ID from storage', () => {
  setTestStorageKey('DataSubjectId', 'test-uuid-123')
  const id = getOrCreateDataSubjectId()
  expect(id).toBe('test-uuid-123')
})

it('deletes DataSubjectId from storage', () => {
  setTestStorageKey('DataSubjectId', 'test-uuid-123')
  deleteDataSubjectId()
  expect(getTestStorage()).not.toHaveProperty('DataSubjectId')
})
```

---

## Phase 3: Rate Limiting

### 3.1 Create Rate Limiter

**File:** `src/lib/rateLimit/index.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL!,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN!
})

export const rateLimiters = {
  consent: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true
  }),
  consentRead: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true
  }),
  export: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true
  }),
  delete: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    analytics: true
  })
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; reset?: number }> {
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    reset: result.reset
  }
}
```

---

## Phase 4: Core GDPR API Endpoints

### 4.1 POST /api/gdpr/consent

**File:** `src/pages/api/gdpr/consent.ts`

```typescript
import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@/lib/db/supabase'
import { rateLimiters, checkRateLimit } from '@/lib/rateLimit'
import { isValidUUID } from '@/lib/helpers/uuid'
import type { ConsentRequest, ConsentResponse, ErrorResponse } from '@/api/@types/gdpr'

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.consent, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    } as ErrorResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000))
      }
    })
  }

  try {
    const body: ConsentRequest = await request.json()

    // Validate DataSubjectId
    if (!isValidUUID(body.DataSubjectId)) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'INVALID_UUID', message: 'Invalid DataSubjectId' }
      } as ErrorResponse), { status: 400 })
    }

    // Insert consent record
    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .insert({
        data_subject_id: body.DataSubjectId,
        email: body.email?.toLowerCase().trim(),
        purposes: body.purposes,
        source: body.source,
        user_agent: body.userAgent,
        ip_address: body.ipAddress,
        privacy_policy_version: import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION,
        consent_text: body.consentText,
        verified: body.verified ?? false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      success: true,
      record: {
        id: data.id,
        DataSubjectId: data.data_subject_id,
        email: data.email,
        purposes: data.purposes,
        timestamp: data.timestamp,
        source: data.source,
        userAgent: data.user_agent,
        ipAddress: data.ip_address,
        privacyPolicyVersion: data.privacy_policy_version,
        consentText: data.consent_text,
        verified: data.verified
      }
    } as ConsentResponse), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to record consent:', error)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record consent' }
    }), { status: 500 })
  }
}

export const GET: APIRoute = async ({ request, clientAddress, url }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.consentRead, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    } as ErrorResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000))
      }
    })
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')
  const purpose = url.searchParams.get('purpose')

  if (!DataSubjectId || !isValidUUID(DataSubjectId)) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_UUID', message: 'Valid DataSubjectId required' }
    } as ErrorResponse), { status: 400 })
  }

  try {
    let query = supabaseAdmin
      .from('consent_records')
      .select('*')
      .eq('data_subject_id', DataSubjectId)

    if (purpose) {
      query = query.contains('purposes', [purpose])
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const records = data.map(record => ({
      id: record.id,
      DataSubjectId: record.data_subject_id,
      email: record.email,
      purposes: record.purposes,
      timestamp: record.timestamp,
      source: record.source,
      userAgent: record.user_agent,
      ipAddress: record.ip_address,
      privacyPolicyVersion: record.privacy_policy_version,
      consentText: record.consent_text,
      verified: record.verified
    }))

    return new Response(JSON.stringify({
      success: true,
      records,
      hasActive: purpose ? records.length > 0 : undefined,
      activeRecord: purpose && records.length > 0 ? records[0] : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to retrieve consent:', error)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve consent' }
    }), { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ request, clientAddress, url }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.delete, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    } as ErrorResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000))
      }
    })
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')

  if (!DataSubjectId || !isValidUUID(DataSubjectId)) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_UUID', message: 'Valid DataSubjectId required' }
    } as ErrorResponse), { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .delete()
      .eq('data_subject_id', DataSubjectId)
      .select()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      success: true,
      deletedCount: data?.length || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to delete consent:', error)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete consent' }
    }), { status: 500 })
  }
}
```

### 4.2 GET /api/gdpr/export

**File:** `src/pages/api/gdpr/export.ts`

```typescript
import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@/lib/db/supabase'
import { rateLimiters, checkRateLimit } from '@/lib/rateLimit'
import { isValidUUID } from '@/lib/helpers/uuid'

export const GET: APIRoute = async ({ request, clientAddress, url }) => {
  const { success, reset } = await checkRateLimit(rateLimiters.export, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    }), {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000)) }
    })
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')

  if (!DataSubjectId || !isValidUUID(DataSubjectId)) {
    return new Response('Invalid DataSubjectId', { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .select('*')
      .eq('data_subject_id', DataSubjectId)

    if (error) {
      throw error
    }

    // Remove sensitive fields
    const exportData = data.map(({ ip_address, ...record }) => record)

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-${Date.now()}.json"`
      }
    })
  } catch (error) {
    console.error('Failed to export data:', error)
    return new Response('Failed to export data', { status: 500 })
  }
}
```

### 4.3 Test API Endpoints

Use Postman/Thunder Client or create test file for each endpoint.

---

## Phase 5: Email-Based DSAR Requests

### 5.1 POST /api/gdpr/request-data

### 5.2 GET /api/gdpr/verify

### 5.3 Create /privacy/my-data Page

---

## Phase 6: Newsletter Double Opt-In

### 6.1 POST /api/newsletter

### 6.2 GET /api/newsletter/confirm

### 6.3 Convert Newsletter Form to Web Component

---

## Phase 7: Form Integration

### 7.1 Convert Contact Form to Web Component

### 7.2 Convert GDPR Consent Component to Web Component

### 7.3 Add DataSubjectId to Form Submissions

---

## Phase 8: Cron Jobs

### 8.1 GET /api/cron/cleanup-confirmations

### 8.2 GET /api/cron/cleanup-dsar-requests

### 8.3 Configure vercel.json

---

## Phase 9: Sentry Integration

### 9.1 Update Sentry Init with Conditional PII Scrubbing

### 9.2 Add Consent Store Subscriber

---

## Phase 10: Testing

### 10.1 Setup Ethereal Email

### 10.2 E2E Tests

---

## Phase 11: Deployment

### 11.1 Production Supabase Setup

### 11.2 Vercel Environment Variables

### 11.3 Run Migrations in Production

---

## Open Questions (Must Resolve Before Implementation)

1. **Email Service for Production**: Which service? (Resend, SendGrid, AWS SES?)

We use Resend for site emails. There is substantial configuration to use Resend in the Newsletter component.

2. **Newsletter API Endpoint**: Current implementation? Where is `/api/newsletter` defined?

All API endpoints are defined in the src/pages/api directory. These are deployed as Vercel Functions by Astro.

3. **Contact Form API**: Current implementation? Does it exist?


See above on Newsletter API endpoint.

4. **Upstash Setup**: Do we have Upstash Redis configured? Need credentials for rate limiting.
5. **Production Supabase**: Do we have a production Supabase project? Or create new?

There is a project already setup. All relevant API keys and links are in the .env file in the roof of the project:

// Password to the database, not sure if we need.
SUPRABASE_DATABASE_PASSWORD

// A RESTful endpoint for querying and managing your database.
PUBLIC_SUPABASE_URL

// Anon public API key
PUBLIC_SUPABASE_KEY

// Secret service key that can bypass RLS
SUPABASE_SERVICE_ROLE_KEY

## Critical Notes

1. **Side Effects File** (`src/components/scripts/bootstrap/consent/index.ts`):
   - Needs updating to log consent changes to API
   - Already has good structure with `initConsentSideEffects()` and `initStateSideEffects()`
   - Add new side effect to call `/api/gdpr/consent` on consent changes

2. **Component Conversion Strategy**:
   - Convert components AS we modify them (not separate phase)
   - Follow ThemePicker web component pattern
   - Use `transition:persist` on custom elements

3. **DataSubjectId vs Email**:
   - DataSubjectId is client-generated, persistent
   - Email is optional, added on form submission
   - Two-record pattern for newsletter: unverified (no email) → verified (with email)

4. **Testing Strategy**:
   - Use nanostore test API (`useTestStorageEngine`) for localStorage tests
   - Use Ethereal for email testing (free, no limits)
   - Test RLS policies thoroughly before moving forward
