# Screen reader safe browser APIs

Our primary compatibility concern is screen readers (often running the site inside constrained WebViews). Treat common platform APIs as optional and potentially throwing.

## Rules of thumb

- Feature-detect before use, and assume the API may be missing.
- Wrap usage in `try/catch`; failures should not crash the page.
- Prefer no-op or “load immediately” fallbacks over throwing.
- Keep selectors dumb: no `HTMLCanvasElement` checks, no calling Canvas APIs in `selectors.ts`; detect by tag/attributes only.

## Crash points to guard

- Canvas
  - Never call `getContext()` without checking the element exists and `typeof canvas.getContext === 'function'`.
  - If canvas setup fails, skip the effect (silent degrade).

- Clipboard
  - Guard `navigator?.clipboard?.writeText` and treat it as best-effort.
  - If unavailable or rejected, return `false` and continue.

- `CSS.supports`
  - Guard `typeof CSS !== 'undefined' && typeof CSS.supports === 'function'`.
  - If unsupported, pick a safe default and continue.

- `IntersectionObserver`
  - Guard `typeof IntersectionObserverCtor === 'function'` before constructing.
  - If unavailable or construction fails, fall back to immediate load/enable behavior.

- Workers
  - Guard `typeof Worker === 'function'`.
  - If a worker-backed init fails, retry once with `{ useWorker: false }`, otherwise no-op.

## Other high-value guards

- `matchMedia`
  - Don’t use weak presence checks like `('matchMedia' in window)`.
  - Require `typeof window.matchMedia === 'function'` before calling.

- Storage (`localStorage` / `sessionStorage`)
  - Storage access can throw in constrained contexts.
  - Wrap `getItem`/`setItem`/`removeItem` in `try/catch` and degrade gracefully.

- `customElements`
  - Guard `globalThis.customElements` and wrap `define()` in `try/catch`.
  - If registration fails, skip enhancement.
