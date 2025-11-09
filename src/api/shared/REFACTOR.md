# Proposed API: /api/gdpr Endpoints:

## `POST /api/gdpr/consent` - Record new consent

- Purpose: Log when a user gives consent
- Request body:

```typescript
{
  email: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  source: 'contact_form' | 'newsletter_form' | 'download_form'
  userAgent: string
  ipAddress?: string
  consentText?: string
  verified?: boolean
}
```

- Response:

```typescript
{
  success: true,
  record: ConsentRecord
}
```

## `GET /api/gdpr/consent?email={email}` - Get all consent records

- Purpose: Data subject access request (GDPR Article 15)
- Query params: email (required)
- Response:

```typescript
{
  success: true,
  records: ConsentRecord[]
}
```

## `GET /api/gdpr/consent?email={email}&purpose={purpose}` - Get consent by purpose

- Purpose: Check if user has consent for specific purpose
- Query params: email (required), purpose (optional)
- Response:

```typescript
{
  success: true,
  records: ConsentRecord[],
  hasActive: boolean,
  activeRecord: ConsentRecord | null
}
```

## `GET /api/gdpr/export?email={email}` - Export user data

- Purpose: GDPR Article 15 - Right of Access (portable data format)
- Query params: email (required)
- Response: JSON export of all consent data (omits sensitive fields)

## DELETE `/api/gdpr/consent?email={email}` - Delete consent records

- Purpose: GDPR Article 17 - Right to Erasure
- Query params: email (required)
- Response:

```typescript
{
  success: true,
  deletedCount: number
}
```

## Questions

**Authentication:** Should these endpoints require authentication/authorization? Currently they accept any email address, which could be a privacy concern.

**Internal vs External:** Should these be:

- **Internal-only** (called only by other backend API routes, not exposed to frontend)?
- **Public** (callable from frontend with proper validation)?

**Response format:** Do you want consistent response wrappers like { success: boolean, data: ..., error?: string } or simpler direct responses?

**Rate limiting:** Should we add rate limiting to prevent abuse (especially for DELETE operations)?

## Privacy Policy Version as env var

Env var name options:

- ✅ PUBLIC_PRIVACY_POLICY_VERSION - Good! Public prefix means it's exposed to client
- PRIVACY_POLICY_VERSION - Simpler, but not public by default in Astro
- PUBLIC_PRIVACY_POLICY_DATE - More semantic (it's a date, not version number)

Value format suggestions:

- Date-based: 2025-11-09 (ISO date of last privacy policy update)
- Semantic versioning: 1.2.0 (if you track major changes)
- Timestamp-based: 20251109 (compact, sortable)
- Git hash: a1b2c3d (if policy is in repo)

Recommendation:

```typescript
// Use PUBLIC_PRIVACY_POLICY_VERSION with ISO date format
// Example:
PUBLIC_PRIVACY_POLICY_VERSION=2025-11-09const privacyPolicyVersion = import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION || '2025-11-09' // fallback
```

Better approach - Get from file metadata:

```typescript
// If privacy policy is a markdown file, get its modified date
import { stat } from 'node:fs/promises'

async function getPrivacyPolicyVersion(): Promise<string> {
  if (import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION) {
    return import.meta.env.PUBLIC_PRIVACY_POLICY_VERSION
  }

  try {
    const stats = await stat('./src/content/privacy/index.md')
    return stats.mtime.toISOString().split('T')[0] // YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0] // Fallback to today
  }
}
```

My recommendation:

- Use PUBLIC_PRIVACY_POLICY_VERSION env var
- Format: ISO date YYYY-MM-DD
- Set it in .env and update when privacy policy changes
- In production, set via Vercel environment variables
- Optional: Add a build-time script that reads the privacy policy file's last modified date and sets it automatically
