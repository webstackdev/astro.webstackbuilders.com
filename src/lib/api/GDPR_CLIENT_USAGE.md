# GDPR API Usage Guide

This guide now focuses on sharing contract types between the SSR endpoints and any client or server-side callers. Implementation code should live alongside the endpoint that owns it. Shared files only export types.

## 1. Import the contract types

```typescript
import type {
  ConsentRequest,
  ConsentResponse,
  DSARRequestInput,
  DSARResponse,
  ErrorResponse
} from '@pages/api/_contracts/gdpr.contracts'
```

Using these shared types keeps both sides of the API honest without duplicating runtime logic.

## 2. Client-side consent submission example

```typescript
const payload: ConsentRequest = {
  DataSubjectId: consentState.DataSubjectId,
  purposes,
  source: 'cookies_modal',
  userAgent: navigator.userAgent,
  verified: false,
}

const response = await fetch('/api/gdpr/consent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

const data: ConsentResponse | ErrorResponse = await response.json()
```

Because the payload is typed, any contract drift is caught at build time.

## 3. Server-side helper usage

Server routes can call the shared logger helper:

```typescript
import { recordConsent } from '@pages/api/_logger'

await recordConsent({
  origin: new URL(request.url).origin,
  DataSubjectId: subjectId,
  email: validatedEmail,
  purposes: ['contact'],
  source: 'contact_form',
  userAgent,
  verified: true,
})
```

`recordConsent` now encapsulates the fetch logic so API routes stay minimal while still using the shared contracts.

## 4. Recommended workflow

1. Define every request/response shape in `@pages/api/_contracts`.
2. Import those types in both the endpoint implementation and any caller (client or server).
3. Keep shared files type-only to avoid duplicated runtime logic.
4. Let each runtime (client, API route, worker) own the fetch/request mechanics that make sense for its environment.

## 5. Available GDPR types

- `ConsentRequest` – Consent recording payload
- `ConsentResponse` – Consent creation response
- `DSARRequestInput` – Data request payload
- `DSARResponse` – Data request confirmation response
- `ErrorResponse` – Standardized error format
