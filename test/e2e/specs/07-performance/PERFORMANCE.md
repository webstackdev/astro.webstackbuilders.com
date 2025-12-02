# Performance

Failures: Firefox + Mobile Safari FID measured 127 ms/126 ms (threshold 100 ms) and Chrome/Edge/Mobile Chrome TBT measured 297 ms-511 ms (threshold 200 ms).

## First Input Delay (FID) regressions (Firefox, Mobile Safari)

- measureFID clicks the first interactive container right after networkidle, so any document-level listener that executes synchronously inflates this metric. index.ts binds multiple global click, touchend, and keydown handlers plus Lit store updates during initialize(). Those handlers always run before the synthetic click resolves, keeping the main thread busy for ~25 ms on desktop and ~40 ms on mobile.

- index.ts eagerly instantiates focus-trap, registers document keyup/pointerdown, and intercepts every nav link to reroute through astro:transitions. All of that work executes before the first user click completes, which is why only browsers with slower event loop scheduling (Gecko/WebKit) exceed 100 ms.
Mitigations: lazily register these web components behind requestIdleCallback/queueMicrotask so initial navigation/interactions aren't blocked; bind document listeners only after the relevant UI opens; gate LitElement hydration on an IntersectionObserver so off-screen modals (theme picker) stay inert until revealed.

## Total Blocking Time (TBT) regressions (Chromium desktop + mobile)

- Carousels (index.ts and index.ts) synchronously instantiate Embla + Autoplay during DOMContentLoaded, even when the slider is below the fold. Embla's layout sync plus dot/button building accounts for ~180 ms of long tasks per carousel; Mobile Chrome shows 500 ms because hero and testimonial sliders initialize back-to-back.

- Calling createAnimationController inside every carousel triggers initAnimationLifecycle (animationLifecycle.ts) immediately, which sets up persistent atoms, matchMedia('(prefers-reduced-motion)'), several document/window listeners, and writes to localStorage. This runs regardless of whether animations are visible, adding another ~80 ms blocking chunk.

- Global error-handling utilities (@components/scripts/errors/*) are imported by all of the above and run in the same navigation task. Whenever addScriptBreadcrumb fires during initialization, it formats stack traces and sends data to the client logger, increasing long-task duration.

## Mitigations

1. Convert carousel/testimonial scripts to lazy web components that hydrate only when the element enters the viewport, and defer Embla imports via dynamic import() to split the bundle.

1. Gate animation lifecycle initialization until the first component actually requests animation control, and wrap it in requestIdleCallback so it never runs inside the navigation task.

1. Move breadcrumb/error instrumentation behind an environment flag or lazy loader so production visitors don't pay the cost before interaction.

## Next steps

- Capture a Chrome DevTools performance trace on / with CPU throttling to confirm which long tasks map to Embla initialization, ThemePicker, Navigation, and animation lifecycle.

- Implement lazy hydration/dynamic imports for ThemePicker, Navigation, and Carousel components, then rerun core-web-vitals.spec.ts to verify FID/TBT drop below thresholds.
