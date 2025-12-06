<!-- markdownlint-disable-file -->
# Performance

continue

Latest run (Dec 2, 2025):

- Mobile Chrome LCP measured 4.3 s (threshold 2.5 s)
- Mobile Chrome FCP measured 5.3 s (threshold 1.8 s)
- Mobile Chrome TBT measured 228 ms (threshold 200 ms)
- Microsoft Edge TBT measured 466 ms (threshold 200 ms)
- Historical: Firefox + Mobile Safari FID measured 127 ms/126 ms (threshold 100 ms)

## Largest Contentful Paint regressions (Mobile Chrome)

- `src/components/Animations/Computers/index.astro` injects a 600×600 SVG and immediately executes `@components/Animations/Computers/client/index.ts`, which imports GSAP, Lit, and the animation store. The custom element performs >150 `gsap.set`/`gsap.to` calls synchronously before setting the SVG to `visibility: visible`, so the hero (the LCP candidate) is timestamped around 4.2 s on the Pixel emulation.

- `astro.config.ts` enables `prefetch: true`, so the client router prefetches every in-viewport `<a>` after `DOMContentLoaded`. The home page exposes 30+ internal links (hero CTAs, three carousels, CTA blocks, footer), meaning the hero image request is queued behind dozens of route/module fetches, delaying paint.

- Playwright perf runs disable the service worker (`window.__disableServiceWorkerForE2E = true`), so every test is a cold navigation that redownloads fonts and hero artwork. When that happens concurrently with GSAP initialization, the hero frequently lands outside the 2.5 s budget.

**Mitigations:**

- Convert the hero animation into a lazy island (e.g., `client:visible` + `requestIdleCallback`) so GSAP only loads after the hero intersects, and ship a static SVG poster by default.

- Gate global prefetching behind an env flag (such as `prefetch: process.env.DISABLE_PREFETCH === '1' ? false : true`) so CI/perf runs can keep hero requests at the front of the queue.

- Provide a cached hero path for tests (preload hero assets once per Playwright worker or expose a hook that skips hero hydration) so each navigation is not a cold start.

## First Contentful Paint regressions (Mobile Chrome)

- `BaseLayout.astro` registers CookieConsent, ThemePicker, Header/Nav, and the hero animation before `<main>`. Each registration pulls in `lit`, `embla`, `gsap`, and `@components/scripts/store`, so the browser spends several seconds parsing/executing JS before the first paint can occur, pushing FCP to 5.3 s.

- The cookie banner (`@components/Consent/Banner/index.astro`) renders a full-width dialog at the top of the DOM. Even though `BasePage.dismissCookieModal()` hides it later, the overlay participates in the first paint and forces layout work for a large chunk of HTML before hero text can display.

- Because service workers are disabled, every perf test re-fetches fonts, newsletter assets, and carousel data. Coupled with immediate hydration of three carousels plus the hero animation, the browser cannot emit `first-contentful-paint` until those synchronous tasks finish.

**Mitigations:**

- Move heavy islands (hero animation, carousels, testimonials) to `client:visible`/`client:idle` and fall back to simple CSS transitions for the above-the-fold hero so HTML can paint immediately.

- Defer cookie banner hydration for perf/E2E contexts (e.g., check `window.isPlaywrightControlled` or wait for user interaction) so it does not participate in the first paint.

- Introduce a perf-test guard (`if (window.__E2E_DISABLE_HEAVY_JS) return`) inside each `register*WebComponent` helper so Playwright runs can opt out of hydrating non-critical animations entirely.

## First Input Delay (FID) regressions (Firefox, Mobile Safari)

- `src/components/Navigation/client/index.ts` click interceptors and Lit store updates run as soon as `measureFID` triggers a click after `networkidle`. Those document-level handlers run before the synthetic click completes, keeping the main thread busy for ~25 ms on desktop and ~40 ms on mobile.

- The navigation script eagerly instantiates focus-trap helpers, registers document `keyup`/`pointerdown`, and reroutes every `<a>` through Astro view transitions. Browsers with slower event-loop scheduling (Gecko/WebKit) consistently exceed 100 ms because all of that work executes before the first input resolves.

**Mitigations:**

- Lazily register nav/theme components behind `requestIdleCallback`/`queueMicrotask` so first interactions are not blocked.

- Bind document listeners only after the relevant UI opens instead of during global initialization.

- Gate LitElement hydration on an `IntersectionObserver` so off-screen modals stay inert until revealed.

## Total Blocking Time (TBT) regressions (Chromium desktop + mobile)

- Every carousel (`src/components/Carousel/client/index.ts`) hydrates on DOMContentLoaded, instantiating Embla + Autoplay even when sliders sit below the fold. Each instance builds navigation buttons, dots, and animation controllers synchronously, adding 180–220 ms of blocking time on Mobile Chrome and >450 ms on Edge when three carousels initialize back-to-back.

- `createAnimationController` registers nanostore observers, `matchMedia('(prefers-reduced-motion)')`, and localStorage writes for every animation (hero + each carousel). Those listeners run before the page becomes interactive and stack up inside the 5 s TBT window.

- Hero GSAP initialization plus consent logging (`initConsentSideEffects` immediately fetches `/api/gdpr/consent`) execute in the same navigation task, so the long-task observer inside `measureTBT` still sees 200–400 ms of blocking work even after we wait for `networkidle`.

**Mitigations**

- Lazily hydrate carousels/testimonials (intersection observer + dynamic `import('embla-carousel')`) and skip Autoplay during CI/perf runs so fewer long tasks fall inside the measurement window.

- Only create animation controllers once an animation actually needs lifecycle hooks, and wrap registration in `requestIdleCallback` so it lands outside the navigation task.

- Guard consent logging and hero animation hydration with `window.isPlaywrightControlled` so Playwright perf tests can bypass those fetches and GSAP timelines when only static markup is required.

## Next steps

- Capture a CPU-throttled Chrome trace on `/` with and without prefetching to quantify how much GSAP + Embla delay LCP/FCP.

- Add environment toggles for prefetching, hero animation hydration, and consent logging so performance tests can disable those features deterministically.

- Implement lazy hydration/dynamic imports for ThemePicker, Navigation, Carousel, and hero animation components, then rerun `core-web-vitals.spec.ts` across all browser profiles to verify the improvements.
