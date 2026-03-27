<!-- markdownlint-disable-file -->
# Performance

Last audited: December 2025
Updated: March 2026

Latest run (March 27, 2026):

- Mobile Chrome LCP measured 25.0s
- Mobile Chrome FCP measured 16.4s
- Mobile Chrome TBT measured 0ms
- Mobile Chrome CLS measured 0
- Mobile Chrome Speed Index measured 16.4

## Largest Contentful Paint regressions (Mobile Chrome)

1. `src/components/Animations/Terraform/index.astro` injects a 600×600 SVG and immediately executes `@components/Animations/Terraform/client/index.ts`, which imports GSAP, Lit, and the animation store. The custom element performs ~40 GSAP timeline steps synchronously before setting the SVG to `visibility: visible`, so the hero (the LCP candidate) is delayed. The animation is `hidden lg:flex` so mobile viewports skip it, but desktop Lighthouse audits are affected. The `<script>` tag is a plain eager import — no `client:visible` or `requestIdleCallback` wrapping.

2. `astro.config.ts` enables `prefetch: true`, so the client router prefetches every in-viewport `<a>` after `DOMContentLoaded`. The home page exposes 30+ internal links (hero CTAs, carousels, CTA blocks, footer), meaning the hero image request is queued behind dozens of route/module fetches, delaying paint.

3. Playwright perf runs are cold navigations. Service workers are intentionally disabled on the dev server (incompatible with the current dev server setup), so each test re-downloads fonts and hero artwork. When that happens concurrently with GSAP initialization, the hero frequently lands outside the 2.5 s budget.

**Mitigations:**

- Wrap `registerTerraformAnimationWebComponent()` in `requestIdleCallback` so GSAP + Lit only load after the browser is idle. The SVG already starts as `visibility: hidden`, so it serves as its own static poster until the animation initializes.

- Gate global prefetching behind an env flag (e.g., `prefetch: process.env.DISABLE_PREFETCH === '1' ? false : true`) so CI/perf runs can keep hero requests at the front of the queue.

- For test infrastructure: preload hero assets once per Playwright worker via `page.route()` interception to avoid re-downloading on every navigation.

## First Contentful Paint regressions (Mobile Chrome)

4. `BaseLayout.astro` registers CookieConsent, ThemePicker, Header/Nav, and the Terraform animation before `<main>`. Each registration is a plain `<script>` tag that Astro compiles to a deferred external module script (`<script type="module" src="...">`). These do not block HTML parsing or initial rendering. However, their deferred execution competes for main-thread time immediately after the DOM is parsed — before `DOMContentLoaded` — which adds to TBT and delays LCP/FCP when multiple heavy modules initialize concurrently. Pre-main JS includes Lit (~16 KB gzipped, imported by CookieConsent, ThemePicker, and Navigation but deduped by the bundler), Embla Carousel (~6 KB gzipped, for the ThemePicker — which is hidden by default and rarely opened), and focus-trap (~4 KB gzipped, for Navigation). GSAP is no longer loaded pre-main; it only loads via the Terraform animation component on the homepage.

5. ~~The cookie banner participates in first paint.~~ **Resolved.** The consent banner dialog now renders with `style="display:none;"`, so it does not contribute to layout or first paint. The `<consent-banner>` web component script still loads eagerly (Lit + store), but that cost is covered by issue #4.

6. Service workers are intentionally disabled on the dev server (incompatible with the current setup), so every perf test re-fetches fonts, newsletter assets, and carousel data. The homepage loads two Embla carousel instances (Articles carousel + Testimonials) plus the ThemePicker carousel in the nav — all three hydrate eagerly via top-level imports. Combined with immediate hydration of the Terraform animation, the browser cannot emit `first-contentful-paint` until those synchronous tasks finish.

**Mitigations:**

- Dynamically import Embla in ThemePicker (e.g., `const { default: EmblaCarousel } = await import('embla-carousel')` inside `connectedCallback`) since the picker is hidden by default. This removes ~6 KB of blocking JS from every page load for a feature most users never open.

- Wrap carousel and testimonials registration in `requestIdleCallback` so Embla only initializes after the browser finishes critical rendering work.

- Wrap consent banner registration in `requestIdleCallback` — the banner starts hidden and does not need to be interactive before first paint.

- The existing `window.isPlaywrightControlled` flag (already set by `BasePage` and checked in `src/components/scripts/store/index.ts`) can be extended to guard more component hydration in perf test contexts.

## Interaction to Next Paint (INP) regressions (Firefox, Mobile Safari)

> Note: FID was replaced by INP in Core Web Vitals as of March 2024. The underlying concerns are the same — main-thread blocking during user interactions.

7. `src/components/Navigation/client/index.ts` registers `document.addEventListener('pointerdown', ..., { capture: true })` and `document.addEventListener('keyup', ...)` eagerly in `connectedCallback`. The `pointerdown` handler early-returns when `!this.isMenuOpen`, so runtime cost is near-zero when the menu is closed. However, the initial setup work — DOM queries, focus-trap instantiation, and link rerouting — happens synchronously in the same task as other component registration, contributing to main-thread contention. Document-level event delegation is the correct pattern for View Transition compatibility (listeners on `document` survive soft loads), so these should not be moved to per-element registration.

8. The navigation script eagerly instantiates focus-trap helpers and reroutes every nav `<a>` through `event.preventDefault()` + `navigate(href)` (Astro View Transitions). All of this happens synchronously in `connectedCallback` → `initialize()` → `bindEvents()`. The focus-trap library (~4 KB) and its DOM setup only need to be ready when the user actually opens the mobile menu, not on every page load.

**Mitigations:**

- Defer the body of `initialize()` behind `requestIdleCallback` so DOM queries, link rerouting, and focus-trap creation do not block the initial rendering task. The document-level `keyup`/`pointerdown` listeners are fine to register eagerly (View Transition best practice) but the surrounding setup should not compete with paint.

- Lazily call `createFocusTrap()` on first menu open instead of in `initialize()`. The focus-trap import and instantiation cost only needs to be paid when the user actually toggles the menu.

## Total Blocking Time (TBT) regressions (Chromium desktop + mobile)

9. Terraform GSAP initialization plus consent logging (`initConsentSideEffects` fires on `astro:page-load` and can immediately fetch `/_actions/gdpr.consentCreate`) execute in the same navigation task. The long-task observer can see 200–400 ms of blocking work when both run synchronously.

**Mitigations:**

- Wrap `registerTerraformAnimationWebComponent()` in `requestIdleCallback` (same as LCP mitigation #1) to move GSAP timeline construction out of the navigation task.

- Defer `initConsentSideEffects()` with `requestIdleCallback` or `setTimeout(..., 0)` so the consent API fetch does not compete with rendering. The existing `window.isPlaywrightControlled` guard already skips consent logging in E2E contexts — verify this covers the perf test path as well.

- Dynamically import Embla for carousels and testimonials (intersection observer + `import('embla-carousel')`) so fewer long tasks fall inside the measurement window.

## Implementation plan

### Phase 1: `requestIdleCallback` wrapping (lowest effort, broadest impact)

Wrap registration calls in `requestIdleCallback` with a `setTimeout` fallback (Safari < 16.4 does not support `requestIdleCallback`). Each change is a 3–5 line wrapper in the component's `<script>` tag or `connectedCallback`.

**Files to change:**

1. `src/components/Animations/Terraform/index.astro` — wrap `registerTerraformAnimationWebComponent()` (addresses issues #1, #9)
2. `src/components/Carousel/index.astro` — wrap `registerCarouselWebComponent()` (addresses issues #4, #6)
3. `src/components/Testimonials/index.astro` — wrap `registerTestimonialsWebComponent()` (addresses issues #4, #6)
4. `src/components/Consent/Banner/index.astro` — wrap `registerConsentBannerWebComponent()` and defer `initConsentSideEffects()` from `astro:page-load` into `requestIdleCallback` (addresses issues #4, #9)
5. `src/components/Navigation/client/index.ts` — defer the body of `initialize()` behind `requestIdleCallback` (addresses issues #7, #8)

**Shared utility:** Create a `requestIdleCallbackCompat()` helper in `src/components/scripts/utils/` that falls back to `setTimeout(..., 0)` when `requestIdleCallback` is not available.

**Validation:** Rerun `core-web-vitals.spec.ts` on chromium. Verify all View Transition navigation still works (navigation, theme persistence, consent).

### Phase 2: Dynamic import for ThemePicker Embla

Move Embla from a top-level `import` to a dynamic `import('embla-carousel')` inside ThemePicker's `connectedCallback` (or a setup method). This removes ~6 KB gzipped from every page's initial JS budget for a feature most users never interact with.

**Files to change:**

1. `src/components/ThemePicker/client/index.ts` — replace top-level `import EmblaCarousel from 'embla-carousel'` with dynamic import in the carousel initialization path

**Validation:** Open ThemePicker, verify carousel still works. Check that no Embla chunk appears in the initial network waterfall.

### Phase 3: Lazy focus-trap in Navigation

Defer `createFocusTrap()` from `initialize()` to first `toggleMenu(true)` call. Replace the top-level `import { createFocusTrap } from 'focus-trap'` with a dynamic import.

**Files to change:**

1. `src/components/Navigation/client/index.ts` — move `setupFocusTrap()` call from `initialize()` into `toggleMenu(true)` path; make `createFocusTrap` import dynamic

**Validation:** Toggle mobile menu, verify focus trap activates. Test Escape key closes menu. Verify View Transition nav links still work.

### Phase 4: Prefetch env flag for perf tests

Gate `prefetch` in `astro.config.ts` behind an environment variable so CI/perf runs can disable it.

**Files to change:**

1. `astro.config.ts` — `prefetch: process.env.DISABLE_PREFETCH === '1' ? false : true`
2. Lighthouse spec or CI config — set `DISABLE_PREFETCH=1` for perf runs

**Validation:** Run Lighthouse spec with flag, verify no prefetch requests in devtools network tab. Run without flag, verify prefetch still works normally.

### Phase 5: Add `isPerformanceTest` guard

Skip non-critical hydration in perf test contexts: carousel autoplay, Terraform animation timeline.

Uses a dedicated `window.isPerformanceTest` flag (NOT the general `isPlaywrightControlled`) so functional E2E tests that exercise animation/autoplay still work.

**Files changed:**

1. `@types/window.d.ts` — added `isPerformanceTest?: boolean` to the `Window` interface
2. `src/components/scripts/embla/EmblaCarouselBase.ts` — skip Autoplay plugin when `isPerformanceTest`
3. `src/components/Animations/Terraform/client/index.ts` — skip animation timeline when `isPerformanceTest`

**Remaining:** Lighthouse / perf E2E spec needs to set `window.isPerformanceTest = true` via `addInitScript` (similar to how `BasePage` sets `isPlaywrightControlled`).

**Validation:** Run perf tests, verify static markup renders without JS-driven animations. Run normal E2E tests to confirm functional tests still pass with animation/autoplay active.

### Execution order

Phases 1–3 are production improvements that benefit all users. Phase 4–5 are test-infrastructure changes. Implement in order, validating after each phase.
