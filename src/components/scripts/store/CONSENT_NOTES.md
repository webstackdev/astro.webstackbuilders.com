# Consent Category Usage Summary

## Categories

### 'necessary' - Essential site functionality, NO consent required

**Always defaults to true and cannot be revoked**

Used for storing:

- **Theme preference** (theme localStorage key)
- **Social embed cache** (oEmbed API responses)
- Consent tracking itself (the consent cookie system)

**Why these are 'necessary' and don't require consent:**

#### Theme Preference

- Purely cosmetic/accessibility preference
- No tracking or personal identification
- Doesn't collect behavioral data
- No third-party data sharing
- Similar to language preference (universally accepted as necessary)
- Users expect UI preferences to persist
- GDPR Recital 30: "not personal data" when used solely for technical delivery

#### Social Embed Cache

- Performance optimization for publicly available content
- Stores only public oEmbed API responses (tweets, YouTube videos, etc.)
- No user authentication tokens or session data
- No browsing history or behavioral tracking
- Content would load anyway - cache just reduces API calls
- Improves user experience and reduces external requests
- Contains no information about which user viewed which embed

### 'functional' - Optional user preferences requiring opt-in

**Defaults to false (opt-in model)**

Used for storing:

- Mastodon instance data (mastodonInstances, mastodonCurrentInstance)

**Why this requires consent:**

- Reveals user's Mastodon instance (can identify where user has account)
- Behavioral tracking (records which instances user interacts with)
- Creates persistent profile of social media preferences
- May reveal username indirectly on small/single-user instances
- GDPR Article 4(1): This is personal data requiring explicit opt-in consent

@TODO: How would we provide opt-in for Mastodon instances? Just the general cookie consent and customize banner and page, or should there be a special way to do it like the GDPR consent form on the social share page?

### 'analytics' - Infrastructure only, NO implementation

- Has store ($hasAnalyticsConsent)
- Has methods (enableAnalytics(), disableAnalytics())
- Defaults to false (opt-in model)
- No actual analytics code exists - just empty stubs

### 'marketing' - Infrastructure only, NO implementation

- Has store ($hasMarketingConsent)
- Has cookie (consent_marketing)
- Defaults to false (opt-in model)
- No actual marketing code exists - just empty stubs

## Social embed cache - MOVED TO 'necessary'

**No longer requires consent - classified as necessary for technical delivery**

1. ✅ **No GDPR risk** - Stores only public data, no personal information
2. ✅ **Performance optimization** - Reduces API calls and speeds up page loads
3. ✅ **No behavioral tracking** - Doesn't track which user viewed which embed

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

## Mastodon instance data - Requires opt-in consent

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

### ✅ IMPLEMENTED CHANGES FOR GDPR COMPLIANCE

1. ✅ **In 'functional' category** (correctly categorized)
2. ✅ **Default is FALSE** - Opt-in model, not opt-out
3. ✅ **Separated from 'necessary' items** - Theme and cache are 'necessary', Mastodon is 'functional'
4. **TODO:** Clear consent purpose - User must understand they're storing social media instance data
5. **TODO:** Easy revocation - Must be able to remove saved instances without losing other preferences

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

#### 1. **Theme Preference** (`setTheme()`) - NO LONGER GATED

```typescript
// src/components/scripts/store/themes.ts
// CHANGED: Theme is now 'necessary' - always saved to localStorage
localStorage.setItem('theme', themeId)
// No consent check required
```

#### 2. **Mastodon Instance Storage** (`saveMastodonInstance()`) - GATED BY FUNCTIONAL

```typescript
// src/components/scripts/store/mastodonInstances.ts
const hasFunctionalConsent = $consent.get().functional
if (!hasFunctionalConsent) return  // Early exit - won't save instance
// NOW DEFAULTS TO FALSE - user must opt-in
```

#### 3. **Social Embed Cache** (`cacheEmbed()`, `getCachedEmbed()`) - NO LONGER GATED

```typescript
// src/components/scripts/store/socialEmbeds.ts
// CHANGED: Social embed cache is now 'necessary' - always cached
// No consent check required
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
