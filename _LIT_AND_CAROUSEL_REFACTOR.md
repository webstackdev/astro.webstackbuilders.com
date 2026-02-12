1. Issues with refactoring Carousel and Testimonials to LitElement
No real blockers. The migration is straightforward because:

Light DOM is already solved. ThemePicker demonstrates the pattern: createRenderRoot() { return this }. Since all three components render their HTML via Astro templates (not Lit's render()), this is the correct approach and already in use.
LitElement is already bundled. ThemePicker pulls it in, so there's no added dependency cost.
Lifecycle maps cleanly. The manual connectedCallback → initialize() pattern in Carousel/Testimonials translates directly. The main changes are calling super.connectedCallback() / super.disconnectedCallback() and optionally using firstUpdated() instead of the manual DOMContentLoaded check.
Nanostore integration improves. Carousel and Testimonials currently call createAnimationController manually. With LitElement they could use StoreController for reactive bindings (like ThemePicker does with createThemeController), though it's not required since the animation lifecycle uses callbacks rather than direct store subscriptions.
The only thing to watch: the transition:persist directive must remain on the HTML custom element tag itself, not on an Astro component wrapper. That's already a project rule and isn't affected by LitElement vs HTMLElement.

2. Revised recommendation

With all three components sharing LitElement as a base, an abstract base class becomes the cleanest option.

Proposed structure:

```bash
src/components/scripts/embla/ 
  EmblaCarouselBase.ts   – abstract LitElement base class
  types.ts               – shared types (TimerHandle, EmblaRootElement, etc.)
  logging.ts             – createE2ELogger(prefix)
```

## What goes in EmblaCarouselBase extends LitElement

All the code that's currently duplicated (~400 lines between Carousel and Testimonials):

Responsibility	Implementation
Light DOM	createRenderRoot() { return this }
Embla init/destroy	initEmbla() / teardownEmbla() with options from abstract getter
Autoplay plugin	Setup, pending-state queue, scheduleAutoplayReady(), flushPendingAutoplayState()
pause() / resume() public API	Identical in both today
Viewport observer	setupViewportObserver() / teardownViewportObserver() / syncAutoplayWithViewport()
Animation lifecycle	registerAnimationLifecycle() wrapping createAnimationController
Focus-visible pause	handleFocusIn() / scheduleFocusVisiblePauseSync() / syncFocusVisiblePauseState()
Prev/next buttons	setupNavigationButtons() with enable/disable state updates
Dots navigation	setupDotsNavigation() with an overridable method for dot active styling
E2E logging	logForE2E() using a configurable prefix
data-carousel-ready / data-carousel-autoplay attributes	Set/remove in base
connectedCallback / disconnectedCallback / teardown	Full lifecycle orchestration

### What subclasses configure

Via abstract getters or overridable methods — keeping each subclass to ~50–100 lines of glue:

| Configuration point                                          | Carousel                                                     | Testimonials                                                 | Skills (new)                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `abstract get emblaOptions()`                                | [{ loop: true, align: 'start' }](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | [{ loop: true, align: 'center' }](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | [{ loop: true, align: 'start', dragFree: true }](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) |
| `abstract get autoplayOptions()`                             | [{ delay: 4000, ... }](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | [{ delay: 6000, ... }](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | `null` (no autoplay initially)                               |
| [abstract get animationId()](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | `'carousel'`                                                 | ['testimonials-carousel'](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | `'skills-carousel'`                                          |
| [abstract get scriptName()](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | ['CarouselElement'](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | ['TestimonialsCarouselElement'](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | `'SkillsCarouselElement'`                                    |
| `abstract get logPrefix()`                                   | `'carousel'`                                                 | ['testimonials'](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) | `'skills'`                                                   |
| `abstract get focusVisibleSelector()`                        | `'[data-carousel-slide] :focus-visible'`                     | `'[data-testimonials-slide] :focus-visible'`                 | component-specific                                           |
| `abstract queryElements()`                                   | Uses Carousel selectors                                      | Uses Testimonials selectors                                  | Uses Skills selectors                                        |

Then each subclass adds only its unique features:

| Feature                                                      | Where it lives                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Keyboard nav (ArrowLeft/Right)                               | Carousel subclass only                                       |
| Status region ("Slide X of Y")                               | Carousel subclass only                                       |
| Autoplay toggle button + icon swap                           | Testimonials subclass only                                   |
| Viewport ID / `aria-controls` on buttons                     | Testimonials subclass only                                   |
| Dot active styling ([is-active](vscode-file://vscode-app/usr/share/code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) vs `w-6`) | Override `applyDotActiveStyle()` / `applyDotInactiveStyle()` |

Two reasonable paths:

A: ThemePicker stays independent but extracts just the nav-button wiring into a small utility function in src/components/scripts/embla/navigation.ts (~30 lines). This avoids forcing ThemePicker into a base class that's 90% irrelevant to it.
B: ThemePicker extends EmblaCarouselBase with autoplay disabled and most features no-op'd. This feels forced and adds cognitive overhead for no real benefit.
I'd recommend A. The base class serves the autoplay-carousel family (Carousel, Testimonials, Skills, and any future autoplay carousel). ThemePicker shares one small utility.

Estimated result
EmblaCarouselBase.ts: ~350–400 lines (extracted from current duplication)
Each subclass (Carousel, Testimonials, Skills): ~50–150 lines of component-specific code
navigation.ts utility for ThemePicker: ~30 lines
Net reduction: ~400+ lines eliminated across Carousel and Testimonials
Skills starts with a thin subclass instead of copy-pasting a fourth time