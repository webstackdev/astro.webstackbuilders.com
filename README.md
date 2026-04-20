# Webstack Builders Corporate Website

Production corporate website built with [Astro](https://astro.build), deployed on Vercel. This repo reflects how I approach production systems: strict code boundaries, layered quality gates, GDPR-compliant data handling, and tested infrastructure from the markdown pipeline through to transactional email.

## What's Different About This Repo

Most Astro sites are content-only. This one runs a full backend (Astro Actions, Turso/SQLite, Sentry, GDPR consent tracking, transactional email) alongside a content pipeline with 30+ remark/rehype plugins, all enforced by custom ESLint rules, multi-tier testing, and 12 CI/CD workflows.

## Architecture Highlights

### Strict Client/Server Code Segregation

Every interactive component follows a `client/` and `server/` folder convention. Client-side Lit web components live in `client/index.ts`; build-time logic lives in `server/index.ts`. The `src/lib/` directory is server-only by rule. This prevents accidental bundling of secrets or server dependencies into client code and makes the boundary auditable at a glance.

### Astro Actions as the Backend Layer

Server-side behavior uses [Astro Actions](https://docs.astro.build/en/guides/actions/) (`src/actions/`) instead of traditional API endpoints. Each action domain (contact, downloads, GDPR, newsletter, search, webmentions) encapsulates its own Zod validation schemas, domain logic, and error handling. A shared error handler (`actionsFunctionHandler.ts`) provides structured logging, Sentry forwarding with scrubbed PII, and consistent error codes.

### GDPR Consent and Privacy Architecture

Cookie consent state is managed via nanostores with persistent localStorage sync across multiple purpose categories (analytics, marketing, functional). Consent events are logged to Astro DB with data subject IDs, user agents, and privacy policy versions for audit compliance. The system includes debounced/coalesced API calls with retry logic, DSAR (Data Subject Access Request) workflows, and double-opt-in newsletter confirmation with expiring tokens.

### Sentry Integration (Client and Server)

Client-side Sentry respects GDPR consent before sending PII. The `beforeSend` handler filters known handled errors (downloads, newsletter, consent retries) to reduce noise. Server-side actions report errors with structured context (stage, fingerprint, input shape without raw PII). Source maps are uploaded per release for stack trace resolution.

### Astro DB with Turso

Schema lives in `db/config.ts` with four tables: `consentEvents`, `rateLimitWindows`, `dsarRequests`, and `newsletterConfirmations`. Composite indexes optimize consent history and GDPR request lookups. Local development uses a file-based SQLite snapshot; production reads from Turso, with schema promotion controlled by a dedicated CI workflow.

## Reusable Patterns for Astro Projects

### Playwright E2E Framework

The E2E setup uses a page object model (POM) with a `BasePage` base class and domain-specific pages (PWA, Markdown, Newsletter). Fine-grained timeout management via `waitTimeouts.ts` (tinyUi, quickAssert, navigation) prevents both flakiness and masking of performance regressions. The config enforces serial execution (`workers: 1`) in CI, with HTML/JSON reporting and screenshot capture on failure.

**Key files:** `playwright.config.ts`, `test/e2e/`

### Rehype/Remark Pipeline with Robust Tests

The markdown pipeline integrates 30+ plugins across remark and rehype stages, including custom plugins for code tabs, abbreviations, smartypants typography, grid tables, math (MathJax), diagrams (Mermaid), and accessible emoji. Each plugin is explicitly named for debugging. Testing is stratified into three tiers:

- **Unit tests**: isolated single-plugin behavior
- **Integration tests**: multi-plugin interaction and conflict detection
- **E2E tests**: full pipeline rendered in real pages via Playwright

**Key files:** `src/lib/markdown/`, `astro.config.ts` (plugin chain)

### MJML Email Templating

Transactional emails use MJML templates compiled through Nunjucks for dynamic data injection. The compiler generates both HTML and plain-text outputs. Company metadata is injected from a centralized `contact.json` so branding stays consistent across all email types.

**Key files:** `src/actions/utils/email/`

### Linting and Custom ESLint Rules

Beyond standard TypeScript and Stylelint rules, the project includes custom ESLint plugins that enforce architectural patterns:

- `enforce-centralized-events` &mdash; prevents inline event listener registration
- `no-html-element-assertions` &mdash; blocks raw HTML assertions in E2E tests
- `no-query-selector-outside-selectors` &mdash; forces DOM queries through centralized selector modules

Stylelint enforces modern CSS notation (short hex, angle notation for hue) and prohibits `!important` in favor of cascade layers.

**Key files:** `eslint.config.ts`, `stylelint.config.mjs`

### AI-Assisted Development Skills

Seven skill guides under `.github/skills/` encode tested domain patterns for CSS, JavaScript/TypeScript, testing, view transitions, markdown/Mermaid, and Astro documentation authoring. Each skill provides concrete rules and examples so that AI tools (and new contributors) produce output consistent with project conventions. Instruction files in `.github/instructions/` set global rules for theme colors and general coding standards.

**Key files:** `.github/skills/`, `.github/instructions/`

### Lit Web Components

Interactive UI uses Lit (`LitElement`) instead of a framework like React or Vue. Components use shadow DOM for encapsulation, declarative properties for reactive updates, and standard web component APIs. This avoids framework lock-in and produces smaller client bundles.

### View Transitions

The site uses Astro View Transitions with `astro-vtbot` for debugging. Key components (ThemePicker, Footer, Meta) use `transition:persist` to maintain state across client-side navigations without re-initialization.

### PWA and Offline Support

A Workbox service worker (`injectManifest` strategy) provides intelligent offline support with an offline fallback page. The manifest supports window controls overlay and maskable icons.

### Content Collections

Content is organized into typed collections: articles, authors, case studies, clients, services, testimonials, and tags. A `test-fixtures/` directory enables markdown pipeline testing against real content structure.

## CI/CD

Twelve GitHub Actions workflows cover the full lifecycle:

| Workflow | Purpose |
|---|---|
| `lint.yml` | TypeScript, ESLint, Stylelint, Prettier, Astro check |
| `test.yml` | Vitest unit tests with local SQLite |
| `playwright.yml` | E2E browser tests with retry and artifact capture |
| `codeql.yml` | Static analysis for security vulnerabilities |
| `dependency-review.yml` | License and vulnerability checks on PRs |
| `deployment-preview.yml` | Vercel preview deploys for PRs |
| `deployment-production.yml` | Vercel production deploys on merge to main |
| `migrations-preview.yml` | Astro DB schema preview |
| `migrations-production.yml` | Turso schema promotion |
| `search.yml` | Search index rebuild |
| `cron.yml` | Scheduled maintenance tasks |
| `branch-protection.yml` | Branch naming and commit policy enforcement |

## Quick Start

```bash
npm install
npm run dev           # start dev server
npm run build:ci      # build with local SQLite
npm run test:unit     # vitest
npm run test:e2e      # playwright
npm run lint          # full lint suite
```

## Tech Stack

Astro, TypeScript, Lit, Tailwind CSS, Turso (libSQL), Sentry, Vercel, Playwright, Vitest, MJML, Workbox, GitHub Actions
