# Consent-Gated Event Implementation

## Overview

Added a new `consent-gated` trigger event to the Scripts/loader system for GDPR-compliant conditional script loading based on user consent preferences.

## Changes Made

### 1. Type Definitions (`@types/loader.ts`)

**Added `consent-gated` to TriggerEvent type:**
```typescript
export type TriggerEvent =
  | 'delayed'
  | 'visible'
  | 'consent-gated'  // NEW
  | 'astro:before-preparation'
  // ... rest
```

**Added ConsentMetadata type:**
```typescript
export type ConsentMetadata = {
  consentCategory?: 'necessary' | 'analytics' | 'advertising' | 'functional'
  [key: string]: unknown  // Extensible for future metadata
}
```

**Added `meta` property to LoadableScript:**
```typescript
export abstract class LoadableScript {
  public static scriptName: string
  public static eventType: TriggerEvent
  public static targetSelector?: string
  public static meta: ConsentMetadata = {}  // NEW
  // ... methods
}
```

### 2. Loader Implementation (`index.ts`)

**Added ConsentMetadata export:**
```typescript
export type { UserInteractionEvent, TriggerEvent, ConsentMetadata }
```

**Added special handling in registerScript():**
```typescript
if (eventType === 'consent-gated') {
  this.initializeConsentGatedExecution(script)
}
```

**Added initializeConsentGatedExecution() method:**
```typescript
private initializeConsentGatedExecution(script: typeof LoadableScript): void {
  // Temporary: treats as astro:page-load
  // TODO: Implement actual consent checking
}
```

### 3. Documentation (`LOAD_EVENTS.md`)

Added comprehensive documentation for the `consent-gated` event including:
- Purpose and use cases
- Configuration requirements
- Usage example
- Planned features
- GDPR compliance notes

## Current Behavior

**Temporary Implementation:**
- Scripts with `eventType: 'consent-gated'` currently execute as `astro:page-load` events
- Warns in console if `meta.consentCategory` is missing
- Does not yet check actual consent cookies

## TODO: Full Implementation

The following tasks remain for complete GDPR compliance:

1. **Import consent utilities:**
   ```typescript
   import { getConsentCookie } from '@components/Cookies/Consent/cookies'
   ```

2. **Check consent before execution:**
   ```typescript
   const consentCategory = script.meta?.consentCategory
   if (!consentCategory) {
     console.warn(`Script ${script.scriptName} missing consentCategory`)
     return
   }

   const consent = getConsentCookie(consentCategory)
   if (consent === 'granted') {
     this.executeScript(script)
   } else {
     console.info(`Script ${script.scriptName} blocked - consent not granted for ${consentCategory}`)
   }
   ```

3. **Listen for consent changes:**
   - Monitor consent cookie updates
   - Dynamically load scripts when consent is granted
   - Consider using `CustomEvent` for consent change notifications

4. **Handle edge cases:**
   - First-time visitors (no consent cookie yet)
   - Consent withdrawal (should scripts be stopped?)
   - "Necessary" category (always allowed?)

## Usage Example

```typescript
import { LoadableScript, type TriggerEvent } from '@components/Scripts/loader'

class SentryScript extends LoadableScript {
  static override scriptName = 'Sentry'
  static override eventType: TriggerEvent = 'consent-gated'
  static override meta = {
    consentCategory: 'analytics'
  }

  static override init(): void {
    // Initialize Sentry error monitoring
    // Only executes if user has granted analytics consent
  }

  static override pause(): void {
    // Pause monitoring when tab hidden
  }

  static override resume(): void {
    // Resume monitoring when tab visible
  }

  static override reset(): void {
    // Reset for SPA navigation
  }
}
```

## Integration with GDPR Plan

This implementation supports **Phase 6: Cookie Enforcement** from `/docs/GDPR_COMPLIANCE_PLAN.md`:

- ✅ Infrastructure for consent-based script loading
- ⏳ Actual consent checking (to be implemented)
- ⏳ Integration with cookie consent system
- ⏳ Dynamic script loading on consent changes

## Testing Considerations

When implementing full consent checking:

1. **Unit tests needed:**
   - Script executes when consent granted
   - Script blocked when consent denied
   - Warning logged when consentCategory missing
   - Dynamic loading when consent changes

2. **Integration tests needed:**
   - Sentry blocked without analytics consent
   - Analytics scripts blocked without consent
   - Advertising scripts blocked without consent

3. **E2E tests needed:**
   - User grants consent → scripts load
   - User denies consent → scripts don't load
   - User changes consent → scripts load/unload

## Related Files

- `/src/components/Scripts/loader/@types/loader.ts` - Type definitions
- `/src/components/Scripts/loader/index.ts` - Loader implementation
- `/src/components/Scripts/loader/LOAD_EVENTS.md` - Event documentation
- `/src/components/Cookies/Consent/cookies.ts` - Consent cookie utilities
- `/docs/GDPR_COMPLIANCE_PLAN.md` - Overall GDPR strategy
- `/src/components/GDPRConsent/GDPR_QUESTIONS.md` - Sentry consent issues

## Notes

- Event name chosen: `consent-gated` (clear, self-documenting)
- No fallbackEvent property (always uses astro:page-load for now)
- Structured metadata with `consentCategory` (vs. untyped Record)
- Extensible design allows future metadata without breaking changes
