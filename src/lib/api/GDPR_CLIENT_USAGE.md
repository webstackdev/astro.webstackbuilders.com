# GDPR API Client Usage Guide

This guide shows how to use the type-safe GDPR API client instead of raw fetch calls.

## 1. Import the client functions

```typescript
import { recordConsent, submitDataRequest, recordConsentServerSide } from '@lib/api/gdpr.client'
```

## 2. Client-side usage examples

### Recording consent (cookies modal)

```typescript
// Before (raw fetch):
await fetch('/api/gdpr/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    DataSubjectId: consentState.DataSubjectId,
    purposes,
    source: 'cookies_modal',
    userAgent: navigator.userAgent,
    verified: false,
  }),
})

// After (typed client):
const result = await recordConsent({
  DataSubjectId: consentState.DataSubjectId,
  purposes,
  source: 'cookies_modal',
  userAgent: navigator.userAgent,
  verified: false,
})

if (result.success) {
  console.log('Consent recorded:', result.data.record.id)
} else {
  console.error('Failed:', result.error.message)
}
```

### Submitting data requests (my-data page)

```typescript
// Before (raw fetch):
const response = await fetch('/api/gdpr/request-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    requestType: 'ACCESS'
  })
})
const data = await response.json()

// After (typed client):
const result = await submitDataRequest({
  email,
  requestType: 'ACCESS'
})

if (result.success) {
  accessMessage.textContent = result.data.message
  accessMessage.className = 'form-message success'
} else {
  accessMessage.textContent = result.error.message
  accessMessage.className = 'form-message error'
}
```

## 3. Server-side usage examples

### Contact form API

```typescript
// Before (raw fetch):
const consentResponse = await fetch(`${new URL(request.url).origin}/api/gdpr/consent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    DataSubjectId: subjectId,
    email: formData.email,
    purposes: ['contact'],
    source: 'contact_form',
    userAgent,
    verified: true,
  }),
})

// After (typed client):
const result = await recordConsentServerSide(
  new URL(request.url).origin,
  {
    DataSubjectId: subjectId,
    email: formData.email,
    purposes: ['contact'],
    source: 'contact_form',
    userAgent,
    verified: true,
  }
)

if (!result.success) {
  // Handle error with proper typing
  console.error('Consent failed:', result.error.code, result.error.message)
}
```

## 4. Benefits of the typed client

1. **Type Safety**: Compile-time validation of request/response structures
2. **Error Handling**: Consistent error response format across all functions
3. **IntelliSense**: Auto-completion for all fields and response properties
4. **Documentation**: JSDoc comments with usage examples
5. **Centralized**: Single place to manage API call logic and error handling

## 5. Migration checklist

- [ ] `src/components/scripts/store/consent.ts` - Use `recordConsent()`
- [ ] `src/pages/privacy/my-data.astro` - Use `submitDataRequest()`
- [ ] `src/pages/api/contact/index.ts` - Use `recordConsentServerSide()`
- [ ] `src/pages/api/newsletter/index.ts` - Use `recordConsentServerSide()`

## 6. Contract types

All types are re-exported from `@pages/api/_contracts/gdpr.contracts`:

- `ConsentRequest` - Consent recording payload
- `ConsentResponse` - Consent creation response
- `DSARRequestInput` - Data request payload
- `DSARResponse` - Data request confirmation response
- `ErrorResponse` - Standardized error format