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
# Install Supabase CLI
npm install -D supabase

# Initialize in project (creates supabase/ directory)
npx supabase init

# Start local Supabase with Docker
npx supabase start
```

**Output will show:**

- API URL: `http://localhost:54321`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio URL: `http://localhost:54323`
- Keys: anon, service_role

### 0.3 Environment Variables

Create/update `.env`:

```bash
# Supabase Local (from npx supabase start output)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz  # NEVER add PUBLIC_ prefix!

# Supabase Production (from your production project)
# PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# PUBLIC_SUPABASE_KEY=eyJhbGci...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Email Testing (use Supabase Mailpit - see Phase 10.1)
# ETHEREAL_USER=your-username@ethereal.email
# ETHEREAL_PASS=your-password

# Vercel Cron Jobs
CRON_SECRET=  # Generate with: openssl rand -base64 32

# Upstash (for rate limiting)
KV_URL=
KV_REST_API_UR=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
REDIS_URL=
```

**Generate CRON_SECRET:**

```bash
openssl rand -base64 32
```

**Privacy Policy Version:**

The privacy policy version is automatically determined at build time by the `PrivacyPolicyVersion` Astro integration (`src/integrations/PrivacyPolicyVersion/index.ts`). It uses the git commit date of the privacy policy file and is available as `import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION`. No manual configuration needed.

### 0.4 Create Directory Structure

```bash
mkdir -p src/api/@types
mkdir -p src/pages/api/gdpr
mkdir -p src/pages/api/newsletter
mkdir -p src/pages/api/cron
mkdir -p src/pages/api/_utils
mkdir -p src/components/scripts/consent/db
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
  import.meta.env.PUBLIC_SUPABASE_KEY!
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

**File:** `src/pages/api/_utils/rateLimit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: import.meta.env['KV_REST_API_URL'] as string,
  token: import.meta.env['KV_REST_API_TOKEN'] as string,
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

**Note:** You may see camelCase lint warnings for database column names (`data_subject_id`, `user_agent`, etc.). These are expected - PostgreSQL uses snake_case as standard, and the warnings can be ignored. The same pattern is used in the existing RLS tests.

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

### 10.1 Email Testing with Mailpit

Supabase local development includes **Mailpit** for email testing (no Ethereal needed):

- **Mailpit URL**: `http://127.0.0.1:54324`
- All emails sent from local Supabase are captured in Mailpit
- Access the web UI to view sent emails, test links, etc.
- No additional configuration required

### 10.2 Setup Docker Environments for Local Testing

**Supabase** (already configured in Phase 0.2):

```bash
supabase start  # Runs PostgreSQL + Studio locally
```

**Official Redis Docker image combined with a proxy like Serverless Redis HTTP (SRH)**

Achieve a similar local development environment to Upstash Redis:

- Which proxy to use (e.g., @upstash/redis-http-proxy or similar)
- Docker compose configuration
- How to point UPSTASH_REDIS_REST_URL to local proxy

### 10.3 E2E Tests

- What aspects to test (consent flow, form submissions, DSAR requests)
- Whether to use Playwright (already configured in your project)
- How to handle DataSubjectId in tests (use test engine from nanostores)

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

There is a project already setup. It is the Upstash Redis Marketplace Integration for Vercel. I have installed the @upstash/redis SDK. All relevant API keys and links are in the .env file in the roof of the project:

KV_URL
KV_REST_API_UR
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
REDIS_URL

5. **Production Supabase**: Do we have a production Supabase project? Or create new?

There is a project already setup. I have installed the @supabase/supabase-js SDK. All relevant API keys and links are in the .env file in the roof of the project:

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

4. **Privacy Policy Version**:
   - Automatically generated at build time from git commit date
   - Handled by `PrivacyPolicyVersion` integration (`src/integrations/PrivacyPolicyVersion/index.ts`)
   - Available as `import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION`
   - No manual configuration needed

5. **Testing Strategy**:
   - Use nanostore test API (`useTestStorageEngine`) for localStorage tests
   - Use Mailpit (included with Supabase) for email testing at `http://127.0.0.1:54324`
   - Test RLS policies thoroughly before moving forward

## Completion Output

**Phase 0 Status:** ✅ Complete

✅ 0.1: Dependencies installed (@supabase/supabase-js, uuid, @upstash/ratelimit, nodemailer)
✅ 0.2: Supabase initialized (CLI installed, local instance running)
✅ 0.3: Environment variables documented (Vercel Marketplace Upstash integration keys noted)
✅ 0.4: Directory structure created

**Phase 1: Database & Types** - Complete ✅

Summary

Created:

✅ gdpr.ts - TypeScript interfaces for GDPR consent types
✅ 001_create_consent_records.sql - Main consent tracking table
✅ 002_create_newsletter_confirmations.sql - Newsletter double opt-in table
✅ 003_create_dsar_requests.sql - Data Subject Access Requests table
✅ Applied all migrations to local Supabase database
✅ supabase.ts - Supabase client configurations (admin & public)
✅ rls.spec.ts - RLS policy tests

Database Tables Created:

- consent_records - with RLS policies, indexes on data_subject_id, email, timestamp
- newsletter_confirmations - with RLS policies, indexes on token, expiry
- dsar_requests - with RLS policies, indexes on token, expiry

**Phase 2: DataSubjectId & Consent Store** - Complete ✅

Summary

Created:

✅ uuid.ts - UUID validation function
✅ dataSubjectId.ts - DataSubjectId management (create, delete, cookie sync)
✅ dataSubjectId.spec.ts - Tests for DataSubjectId persistence

Updated:

4. ✅ consent.ts:

- Added DataSubjectId field to ConsentState interface
- Initialize DataSubjectId on store mount with onMount()
- Updated initConsentFromCookies() to include DataSubjectId
- Added Side Effect 2: Log consent changes to /api/gdpr/consent API
- Added Side Effect 3: Delete DataSubjectId when functional consent is revoked

Key Features Implemented:

- DataSubjectId persists to localStorage and syncs to cookie
- Automatic generation of UUID v4 on first visit
- Cookie includes SameSite=Strict and Secure flag in production
- API logging of consent changes with DataSubjectId
- DataSubjectId deletion when functional consent is revoked
- Comprehensive test coverage

Note: Phases 2.5 and 2.6 (converting Consent Modal and Preferences to web components) are marked for later as noted in the implementation plan ("Convert components AS we modify them").

**Phase 3: Rate Limiting** - Complete ✅

I've created rateLimit.ts with:

✅ Upstash Redis configuration using correct env vars (KV_REST_API_URL, KV_REST_API_TOKEN)
✅ Four rate limiters: consent (10/min), consentRead (30/min), export (5/min), delete (3/min)
✅ checkRateLimit() helper function
✅ Updated implementation plan with correct path and env variable names

**Phase 4: Core GDPR API Endpoints** - Complete ✅

✅ consent.ts - Complete GDPR consent API with:

- `POST`: Create consent records with rate limiting (10/min)
- `GET`: Retrieve consent records by DataSubjectId with optional purpose filtering (30/min)
- `DELETE`: Delete all consent records for a DataSubjectId (3/min)

✅ export.ts - Data export endpoint:

- `GET`: Export all consent data for a DataSubjectId as downloadable JSON (5/min)
- Removes sensitive ip_address field from export

All endpoints include:

- Upstash rate limiting
- UUID validation
- Proper error handling
- TypeScript types
- Supabase admin client (bypasses RLS for server-side operations)

Note: The camelCase lint warnings for database column names (data_subject_id, user_agent, etc.) are expected - these match PostgreSQL's snake_case standard and follow the same pattern used in the RLS tests you reviewed earlier.

**Phase 5: Email-Based DSAR Requests** - Complete ✅

✅ POST /api/gdpr/request-data - Initiates DSAR requests:

- Validates email format and request type (ACCESS or DELETE)
- Creates DSAR request record with 24-hour expiration token
- Checks for duplicate requests and resends email if needed
- Sends verification email via Resend
- Rate limited (5 requests/minute)

✅ GET /api/gdpr/verify?token=xxx - Verifies and fulfills requests:

- Validates verification token
- Checks expiration and fulfillment status
- For ACCESS requests: Exports all consent data as JSON download (removes sensitive IP addresses)
- For DELETE requests: Deletes all consent_records and newsletter_confirmations for the email
- Marks request as fulfilled
- Redirects to status pages

✅ email.ts - Email service for DSAR:

- Sends verification emails using Resend
- Different templates for ACCESS vs DELETE requests
- Includes warnings for deletion requests
- 24-hour expiration notice
- Development/test mode skips actual emails

✅ /privacy/my-data page - User-facing interface:

- Two forms: Access My Data and Delete My Data
- Real-time form validation
- Status messages from URL params
- Clear warnings for deletion
- Checkbox confirmation for deletion
- Responsive design with proper styling

The system now provides a complete GDPR-compliant data access and deletion workflow with email verification!

**Phase 6: Newsletter Double Opt-In** - Complete ✅

✅ POST /api/newsletter - Updated to:

- Accept optional DataSubjectId from client (generates UUID if not provided)
- Validate DataSubjectId format
- Create unverified consent record via the new /api/gdpr/consent API
- Store pending subscription in Supabase newsletter_confirmations table with DataSubjectId
- Maintain backward compatibility with in-memory storage

✅ _token.ts - Updated to:

- Include DataSubjectId in PendingSubscription interface
- Store pending subscriptions in Supabase instead of just memory
- Retrieve subscriptions from Supabase in validateToken()
- Mark subscriptions as confirmed in Supabase via confirmSubscription()
- Fallback to in-memory storage for backward compatibility

✅ GET /api/newsletter/confirm - Updated to:

- Remove old recordConsent dependency
- Mark consent records as verified: true in Supabase after email confirmation
- Update consent records matching email, DataSubjectId, and marketing purpose
- Maintain existing ConvertKit and welcome email functionality

Key Features:

- Full integration with new Supabase-based consent system
- Proper double opt-in: unverified consent → email confirmation → verified consent
- DataSubjectId tracking throughout the newsletter flow
- Database persistence for all pending subscriptions
- GDPR-compliant audit trail in consent_records and newsletter_confirmations tables

Note: Web component conversion (Phase 6.3) is deferred per the implementation plan - we'll handle it when actively modifying newsletter components.

**Phase 7: Form Integration** - Complete ✅

✅ Updated POST /api/contact endpoint:

- Added DataSubjectId field to ContactFormData interface (optional)
- Removed dependency on old recordConsent function
- Added UUID validation and generation logic
- Integrated with new /api/gdpr/consent API for consent recording
- Contact form consent is marked as verified: true (no double opt-in needed)
- Graceful error handling - form submission continues even if consent logging fails
- Maintains all existing functionality (email sending, file attachments, etc.)

✅ Deferred Items (per implementation plan):

- 7.1: Contact Form web component conversion - deferred until actively modifying
- 7.2: GDPR Consent component conversion - deferred until actively modifying

Key Features:

- Full integration with Supabase-based consent system
- DataSubjectId tracking for contact form submissions
- Backward compatible - generates UUID if client doesn't provide one
- Non-blocking consent logging - form submission succeeds even if consent API fails
- Immediate verification for contact form consent (no email confirmation needed)

**Phase 8: Cron Jobs** - Complete

1. /api/cron/cleanup-confirmations - Runs daily at 2 AM UTC

- Deletes expired newsletter confirmation tokens
- Removes old confirmed records (7+ days)
- Returns count of deleted records

2. /api/cron/cleanup-dsar-requests - Runs daily at 3 AM UTC

- Removes fulfilled DSAR requests older than 30 days
- Removes expired unfulfilled requests (7+ days old)
- Returns count of deleted records

3. vercel.json - Updated with cron schedules

- Both endpoints secured with CRON_SECRET authorization header
- Runs automatically on Vercel infrastructure

Both endpoints include:

- CRON_SECRET validation for security
- Detailed logging of cleanup operations
- Error handling with proper status codes
- JSON responses with deleted counts

**Phase 9: Sentry Integration** - Complete

1. Client-side Sentry (client.ts):

- Added import of $consent store
- Updated sendDefaultPii to respect analytics consent
- Enhanced beforeSend hook to scrub PII when consent is not granted:
  - Removes IP addresses
  - Removes user agent and request headers
  - Clears breadcrumbs that may contain user interactions
- Added updateConsentContext() method to track consent changes in Sentry

2. Consent Store (consent.ts):

- Added Side Effect 4: Subscribes to $hasAnalyticsConsent changes
- Dynamically imports Sentry to call updateConsentContext()
- Uses lazy loading to avoid circular dependencies
- Includes error handling for environments where Sentry isn't initialized

3. Server-side Sentry (sentry.server.config.js):

- Added clarifying comment that server-side always sends PII
- Server errors need full context as they occur in API/SSR without direct user consent

How it works:

- On initialization, Sentry checks current analytics consent
- If no consent, PII is disabled and events are scrubbed
- When user changes consent, store subscriber updates Sentry context
- Sentry context is tagged with consent status for debugging
- All PII scrubbing happens automatically in the beforeSend hook
