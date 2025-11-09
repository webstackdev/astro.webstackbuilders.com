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
