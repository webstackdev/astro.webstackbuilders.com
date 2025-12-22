<!-- markdownlint-disable-file -->
# TODO

## Refactor API Endpoints to Astro Actions

### Action / Domain / Responder Pattern

- The action takes HTTP requests (URLs and their methods) and uses that input to interact with the domain, after which it passes the domain's output to one and only one responder.

**Here you define the route and the methods (get, post, put, delete)**

`/actions` or `actions.ts`

- This layer contains the business logic and the persistence logic (e.g., using a repository pattern or similar data mappers). The domain services are responsible for reading from and writing to the database to fulfill business requirements.

`/domain`

- The Domain is an entry point to the domain logic forming the core of the application, modifying state and persistence as needed. This may be a Transaction Script, Service Layer, Application Service, or something similar. The Domain in ADR relates to the whole of the domain objects, all the entities and their relations as a whole

`/entities` or `entities.ts`

- Entities are part of the domain. They represent state and core business rules, but not persistence logic. Defined primarily by its unique identity, rather than its attributes or properties.

- By any name the Domain Payload Object is a specialized Data Transfer Object. A Data Transfer Object is a fine-grained object, providing properties that mirror or at least shadow properties found on the domain objects that they replicate. A Domain Payload Object is a coarse-grained object that transfers whole domain object instances to the client.

`/responders` or `responders.ts`

- The responder builds the entire HTTP response from the domain's output which is given to it by the action. The Responder is responsible solely for formatting the final response (e.g., JSON, HTML) to be sent back to the client.

### Endpoints:

- cron/cleanup-confirmations → GET
- cron/cleanup-dsar-requests → GET
- cron/run-all → GET
- social-card/ → GET

- contact/ → POST (contact form submission) and OPTIONS (CORS pre-flight)
- downloads/submit → POST
- gdpr/consent → POST, GET, DELETE
- gdpr/request-data → POST
- gdpr/export → GET
- gdpr/verify → GET
- health/ → GET
- newsletter/ → POST, OPTIONS
- newsletter/confirm → GET

### Files importing from `astro:db`

- _utils/rateLimit.ts
- _utils/rateLimitStore.ts
- cron/cleanup-confirmations.ts
- cron/cleanup-dsar-requests.ts
- gdpr/_utils/consentStore.ts
- gdpr/_utils/dsarStore.ts
- newsletter/_token.ts

### Cross-endpoint dependencies:

gdpr: Mostly self-contained, but `verify.ts` does import `deleteNewsletterConfirmationsByEmail` from `@pages/api/newsletter/_token` (line 15). That's a direct dependency on the newsletter code.

newsletter: `confirm.ts` pulls `markConsentRecordsVerified` from `@pages/api/gdpr/_utils/consentStore` (line 10) to mark double opt-in consent. That's the reciprocal dependency.

Newsletter hits the gdpr consent endpoint using `recordConsent` in `src/pages/api/_logger/index.ts`.

If we want to make it feel less inconsistent, we could either (a) rename `_logger` to something like `_consentClient` so its purpose is clearer, or (b) move to a microservices architecture and expose a protected `/api/gdpr/verify` endpoint and have newsletter call it over HTTP as well - but that would need additional auth to prevent abuse.

**Affected components:**

- CallToAction/Newsletter
- ContactForm

## Refactor Theme Colors

### Color vars

brand primary:    #001733
brand secondary:  #0062B6

ring (1px), ring-2, ring-4
accent

text-white, other default Tailwind colors

## Refactor E2E Test Suite

### Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18) - Needs Percy/Chromatic
Lighthouse audits (6) - Integration pending
Newsletter double opt-in (6) - Email testing infrastructure
Axe accessibility (2) - axe-core integration

### Axe tags

cat.aria: Rules related to Accessible Rich Internet Applications (ARIA) attributes and roles.
cat.color: Rules related to color contrast and meaning conveyed by color.
cat.controls: Rules for interactive controls, such as form elements and links.
cat.forms: Rules specifically for forms, form fields, and their labels.
cat.keyboard: Rules related to keyboard operability.
cat.links: Rules for links, including their names and destinations.
cat.name-role-value: Rules that check if an element has a name, role, and value that can be correctly interpreted by assistive technologies.
cat.semantics: Rules related to the semantic structure of a document, such as headings and landmarks.
cat.sensory-and-visual-cues: Rules that deal with information conveyed by sensory or visual characteristics.
cat.structure: Rules related to the document's overall structure, like the proper nesting of elements.
cat.tables: Rules for data tables, including headers and associations.
cat.text-alternatives: Rules for ensuring that text alternatives are provided for non-text content, such as images.

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Prefetch Links

The default prefetch strategy when adding the data-astro-prefetch attribute is hover. To change it, you can configure prefetch.defaultStrategy in your astro.config.mjs file.

hover (default): Prefetch when you hover over or focus on the link.
tap: Prefetch just before you click on the link.
viewport: Prefetch as the links enter the viewport.
load: Prefetch all links on the page after the page is loaded.

```html
<a href="/about" data-astro-prefetch>
<a href="/about" data-astro-prefetch="tap">About</a>
```

If you want to prefetch all links, including those without the data-astro-prefetch attribute, you can set prefetch.prefetchAll to true:

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  prefetch: {
    prefetchAll: true
  }
})
```

You can then opt-out of prefetching for individual links by setting data-astro-prefetch="false":

```html
<a href="/about" data-astro-prefetch="false">About</a>
```

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

## Analytics

Vercel Analytics

- Highlighter component
- Social Shares component
- Social Embeds: Track embed interactions
- Cookie Consent
- Download Form component

npm i @vercel/analytics
import Analytics from '@vercel/analytics/astro'
https://vercel.com/docs/analytics/quickstart#add-the-analytics-component-to-your-app

## Set up webmentions

Needs to add real API key and test

- Get API token from webmention.io
- Add WEBMENTION_IO_TOKEN to .env
- (Optional) Set up Bridgy for social media
- Test with sample webmentions

## Mobile Social Shares UI

See the example image in Social Shares. The social shares UI on mobile should be a modal that slides in from the bottom.

## Themepicker tooltips, extra themes

- Add additional themes (high contrast)
- Add Carousel
- Add tooltip that makes use of the description field for the theme, explaining what the intent of the theme is

## Sentry feedback, chat bot tying into my phone and email

See note in src/components/scripts/sentry/client.ts - "User Feedback - allow users to report issues"

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway

## Uppy file uploads from contact form

docs/CONTACT_FORM.md

Where to upload to?

## Search

Add Upstash Search as a Vercel Marketplace Integration.

### "Add to Calendar" button

Google Calendar, Apple Calendar,  Yahoo Calender,  Microsoft 365, Outlook, and Teams, and generate iCal/ics files (for all other calendars and cases).

`https://github.com/add2cal/add-to-calendar-button`
`https://add-to-calendar-button.com/`

### Fix to Featured Pages Carousel

Pause carousels on intersection observer, when part of the carousel is scrolled off the page
