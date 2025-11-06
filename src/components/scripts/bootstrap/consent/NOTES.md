# Consent Category Usage Summary

## OT: loader

Components using 'astro:page-load':

Singleton Pattern Components (will refactor now):

✅ CarouselManager
✅ ContactForm
✅ Hero
✅ TestimonialsCarousel
✅ Navigation
✅ HeadThemeSetup

Instance Pattern Components (skip for now):

❌ NewsletterForm - Creates instances per form element
❌ CookieConsent - Instance-based with View Transitions handling
❌ CookieCustomize - Instance-based
❌ DownloadForm - Instance-based
❌ SocialEmbed - Manager with multiple instances
❌ Highlighter - Web Component
❌ MastodonModal - Instance-based
❌ SocialShares - Instance-based
❌ NetworkStatus - Singleton but uses getInstance pattern

## Categories

### 'necessary' - Infrastructure only, NO actual usage

- Always defaults to true and cannot be revoked
- NOT tied to any localStorage items or features
- Only used for consent tracking itself (the consent cookie system)
- Loader comment: "Necessary scripts don't need consent - return a store that's always true"

### 'functional' - Actively used for localStorage management

Used for storing:

- Theme preference (theme localStorage key)
- Mastodon instance data (mastodonInstances, mastodonCurrentInstance) - **GDPR RISK**
- Social embed cache (cleared via clearEmbedCache())
- Defaults to true (opt-out model)

KEY ISSUE: Code comment states: "covers strictly necessary storage for site functionality" - this is conflating 'functional' with 'necessary'

### 'analytics' - Infrastructure only, NO implementation

- Has store ($hasAnalyticsConsent)
- Has methods (enableAnalytics(), disableAnalytics())
- Defaults to false (opt-in model)
- No actual analytics code exists - just empty stubs

### 'advertising' - Infrastructure only, NO implementation

- Has store ($hasAdvertisingConsent)
- Has cookie (consent_advertising)
- Defaults to false (opt-in model)
- No actual advertising code exists - just empty stubs

## Social embed cache

1. Should be 'necessary' - The cache is purely a performance optimization for publicly available content that would load anyway
2. No GDPR risk - It doesn't store any personal data about the site visitor
3. Enhances user experience - Reduces API calls and speeds up page loads

The social embed cache stores oEmbed API responses from third-party platforms. NO user account data is stored. The cache contains:

✅ Not Personal Data:

- Public social media post HTML (tweets, LinkedIn posts, YouTube videos, etc.)
- Public author names and URLs already visible on the post
- Platform metadata (Twitter, YouTube, etc.)
- Content that's publicly accessible without authentication

❌ No Personal Data:

- No user authentication tokens
- No session IDs
- No browsing history
- No user preferences or settings
- No information about which user viewed which embed

## Mastodon instance data - **GDPR VIOLATION**

**What it stores:**

- `mastodonInstances`: Set of up to 5 Mastodon instance domains (e.g., "mastodon.social", "fosstodon.org")
- `mastodonCurrentInstance`: The last used instance domain
- Stored via checkbox: "Remember this instance for future shares"

**GDPR Analysis:**

### ❌ CONTAINS PERSONAL DATA

1. **Reveals user's Mastodon instance** - This can identify where the user has an account
2. **May reveal username indirectly** - Some instances are single-user or small communities
3. **Behavioral tracking** - Records which instances user interacts with
4. **Persistent identifier** - Creates a profile of user's social media preferences

### ❌ CURRENT ISSUES

1. **Opt-out instead of opt-in** - Defaults to `functional: true`, violating GDPR Article 7
2. **Wrong consent category** - Should be in 'functional' with opt-IN, not opt-OUT
3. **Misleading consent** - Conflated with "necessary" which cannot require consent
4. **No granular control** - Bundled with theme preference which IS necessary

### ✅ REQUIRED CHANGES FOR GDPR COMPLIANCE

1. **Keep in 'functional' category** (correctly categorized)
2. **Change default to FALSE** - Must be opt-in, not opt-out
3. **Separate from 'necessary' items** - Theme should be 'necessary', Mastodon should be 'functional'
4. **Clear consent purpose** - User must understand they're storing social media instance data
5. **Easy revocation** - Must be able to remove saved instances without losing other preferences

### Legal Justification

GDPR Article 4(1) defines personal data as "any information relating to an identified or identifiable natural person". A user's Mastodon instance choice:

- Can identify the user (especially on small instances)
- Reveals social media usage patterns
- Could be combined with other data to profile the user

Therefore, it requires **explicit opt-in consent** under Article 7, not opt-out.

---

## Consent Gating Analysis - Limited Implementation

### Where Consent IS Checked (Storage Only)

The consent system currently gates **localStorage writes only**, not component functionality:

#### 1. **Theme Preference** (`setTheme()`)

```typescript
// src/components/scripts/store/themes.ts
const hasFunctionalConsent = $consent.get().functional
if (hasFunctionalConsent) {
  // Only persist to localStorage if consent granted
  localStorage.setItem('theme', themeId)
}
// BUT: Theme still applies even without consent - just not saved
```

#### 2. **Mastodon Instance Storage** (`saveMastodonInstance()`)

```typescript
// src/components/scripts/store/mastodonInstances.ts
const hasFunctionalConsent = $consent.get().functional
if (!hasFunctionalConsent) return  // Early exit - won't save instance
```

#### 3. **Social Embed Cache** (`cacheEmbed()`, `getCachedEmbed()`)

```typescript
// src/components/scripts/store/socialEmbeds.ts
const hasFunctionalConsent = $consent.get().functional
if (!hasFunctionalConsent) return  // Won't cache embed data
if (!hasFunctionalConsent) return null  // Won't retrieve cached data
```

### Where Consent IS NOT Checked (Components Load Regardless)

**No components are consent-gated.** All components load and execute regardless of consent status:

- ❌ No component uses `eventType: 'consent-gated'`
- ❌ No component specifies `meta.consentCategory`
- ✅ All 11 components using `eventType: 'astro:page-load'` load immediately
- ✅ Social embeds (YouTube, Twitter, etc.) load without checking consent
- ✅ Mastodon modal loads and functions without checking consent
- ✅ Testimonials carousel loads without checking consent

### Infrastructure Without Implementation

The loader system **supports** consent-gated execution:

- `initializeConsentGatedExecution()` method exists
- Subscribes to consent store changes
- Would pause/resume scripts based on consent
- **BUT: No scripts are registered with this trigger**

### Side Effects When Consent Revoked

When `functional: false` is set:

1. **localStorage items are cleared** (theme, mastodonInstances, embedCache)
2. **Custom events are dispatched** (`consent-changed`)
3. **BUT: No components listen to these events**
4. **Components continue running** - no pause/resume happens

### Conclusion: Partially Implemented

**Your analysis is CORRECT**:

- ✅ Consent system is **fully built** and **architecturally sound**
- ✅ localStorage writes **are gated** by consent checks
- ❌ Component loading/execution **is NOT gated** by consent
- ❌ Third-party scripts (embeds) **load regardless** of consent
- ❌ No actual analytics or advertising features to gate

**What works:**

- User can revoke consent → localStorage is cleared
- User without consent → data won't be saved (but components still work)

**What doesn't work:**

- User without consent → third-party embeds still load (privacy violation)
- User without consent → all JavaScript still executes
- Revoking consent → doesn't stop running components

**GDPR compliance requires:**

1. Third-party embeds (YouTube, Twitter, etc.) must be consent-gated
2. Mastodon must not save data without opt-in consent
3. Components that track behavior must check consent before executing
