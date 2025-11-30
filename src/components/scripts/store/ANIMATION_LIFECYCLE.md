# Animation Lifecycle System

## Purpose

Provide a single source of truth for background animation state. Every animation-enabled component registers with the store, which in turn tracks:

- Global pause reasons (navigation overlay, document hidden, reduced motion preferences, custom overlays)
- Component-level play/pause capabilities and how to invoke them
- User overrides that must persist across Astro View Transition navigations and full reloads

## Core Features

### 1. Store Backing

- Implemented as a Nanostore module `animationLifecycle.ts` that exports subscription helpers and actions.
- Maintains two atoms:
  - `animationRuntimeState`: in-memory map tracking registered controllers, active pause reasons, and currently playing components.
  - `animationPreferences`: persistent atom stored in `localStorage` to remember per-animation play/pause overrides.
- Provides convenience selectors (e.g., `isAnimationPlaying(id)`, `getActivePauseReasons()`), and composable helpers for components/tests.

### 2. Controller Registration

- Components call `createAnimationController(id, { play, pause, defaultState })` when they mount.
- Controller automatically applies:
  1. System-level pauses (reduced motion, overlays, document hidden)
  2. Stored user preference (playing or paused)
  3. Optional component default (e.g., start paused)
- Returns cleanup + imperative helpers (`requestPlay`, `requestPause`, `setUserPreference`, `clearUserPreference`).
- Controllers unregister during `disconnectedCallback` (or equivalent cleanup) to prevent leaks during view transitions.

### 3. System-Level Event Bridges

- `initAnimationLifecycle()` wires browser events to store actions:
  - `matchMedia('(prefers-reduced-motion: reduce)')` to auto-pause animations unless overridden by user intent.
  - `document.visibilitychange`, `pagehide`, and `pageshow` for tab backgrounding or iOS lifecycle quirks.
  - `astro:page-load` to reapply the latest store snapshot after client-side navigation.
- `setOverlayPauseState(source, isPaused)` handles UI overlays (navigation splash, modal dialogs, future features). Multiple sources can pause simultaneously; resume only occurs when the last pause reason clears.

### 4. User Controls & Persistence

- Any animation component can expose Play/Pause buttons that call `requestPlay()` / `requestPause()`.
- Preferences persist using a `persistentAtom`, so the same animation stays paused/playing after navigation or refresh.
- Reduced-motion preference is treated as a system-level pause; a user request to play overrides it until they pause again.

### 5. Error Resilience & Telemetry

- All controller callbacks are wrapped with `handleScriptError` contexts so a single faulty animation does not break the global lifecycle.
- Store actions log breadcrumbs describing which source triggered state changes to aid debugging.

### 6. Testing Strategy

- Unit tests cover:
  - Store reducers/action behavior (pause reason stacking, preference overrides, controller registration lifecycle)
  - Persistence encode/decode resiliency
  - Browser bridge wiring using mocked `matchMedia` and `document` APIs
  - Component-specific adapters mocking the store to verify pause/resume integration.

### 7. Migration Notes

- Existing `@components/scripts/events/animationLifecycle.ts` is replaced by the store module.
- Consumers (`Animations/Computers`, `Carousel`, `Testimonials`, `Navigation`) switch from `dispatchAnimationEvent` / `onAnimationEvent` to the exported store helpers.
- Additional components can adopt the new system without bespoke event wiring or duplicated logic.
