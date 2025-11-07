# Analysis: Web Components vs Preact vs React

Project Context Summary

- Current state: 16 components recently refactored from LoadableScript to direct initialization
- ThemePicker: Successfully migrated to Web Component (proof of concept)
- Key requirements:
	- View Transitions persistence (transition:persist)
Nanostores integration (already in place)
Animation lifecycle management (pause/resume)
Cookie consent gating system
GSAP (Hero) and Embla (Carousel) library integration
Option 1: Web Components (Custom Elements) ⭐ RECOMMENDED
Pros for Your Project:
Perfect View Transitions fit: Native transition:persist support - your ThemePicker proof-of-concept already demonstrates this works seamlessly
Zero bundle overhead: No framework bytes, aligns with current lightweight approach
Lifecycle hooks match your needs:
connectedCallback() - perfect for astro:page-load replacement
disconnectedCallback() - clean cleanup
adoptedCallback() - works with View Transitions DOM moves
Nanostores integration: Already proven in ThemePicker - $themePickerOpen, $theme work perfectly
Animation control: Can directly implement pause/resume via methods
Progressive enhancement: Works without JavaScript, gracefully degrades
No build complexity: No compat layers, no React wrappers
Cons for Your Project:
No Embla React component: Need to use vanilla Embla API (but you already are)
No GSAP React hooks: Must use vanilla GSAP (but you already are)
Verbose syntax: More boilerplate than framework components
TypeScript complexity: Defining element types requires more setup
Option 2: Preact
Pros for Your Project:
Smaller than React: 3KB vs 40KB+
Nanostores hooks: @nanostores/preact provides useStore() without compat
Component model: Familiar JSX, easier than Web Components for some
Cons for Your Project:
GSAP requires compat: @gsap/react needs preact/compat library (+overhead)
No Embla Preact component: embla-carousel-react won't work, need compat layer
View Transitions friction: transition:persist requires client:only directive, loses SSR benefits
Bundle size: Still adds framework weight (even if small)
Complexity mismatch: Your components are mostly imperative DOM manipulation, not reactive state
Option 3: React
Pros for Your Project:
Embla component: embla-carousel-react available natively
GSAP hooks: @gsap/react available (though useGSAP hook is for convenience, not required)
Ecosystem: Largest component ecosystem
Cons for Your Project:
Massive bundle: 40KB+ gzipped - conflicts with your performance focus
Same View Transitions friction as Preact
Astro mismatch: Astro is explicitly optimized for minimal JS, React conflicts with this philosophy
Overkill: Your components don't need React's reactivity model - they're mostly event-driven DOM manipulation
Recommendation: Web Components (Custom Elements)
Rationale:
Your ThemePicker is the perfect template: It proves Web Components work excellently with:

Nanostores ($themePickerOpen, $theme)
View Transitions persistence
Modal state management
Your error handling system
Migration path is proven:


// Current patterndocument.addEventListener('astro:page-load', () => Component.init())// Web Component pattern (cleaner)customElements.define('component-name', ComponentElement)// <component-name> in template - automatically initializes/cleans up
GSAP and Embla don't need React:

Your Hero already uses vanilla GSAP effectively
Your Carousel uses vanilla Embla - the React wrapper is just convenience
Web Components can call these libraries directly in connectedCallback()
Consent gating fits naturally:


connectedCallback() {  const hasConsent = $hasAnalyticsConsent.get()  if (hasConsent) {    this.startTracking()  }  // Listen for consent changes  this.unsubscribe = $hasAnalyticsConsent.subscribe(...)}
Animation lifecycle integrates cleanly:


class AnimatedComponent extends HTMLElement {  pause() { this.timeline?.pause() }  resume() { this.timeline?.play() }    connectedCallback() {    onAnimationEvent(OVERLAY_OPENED, () => this.pause())    onAnimationEvent(OVERLAY_CLOSED, () => this.resume())  }}
Implementation Strategy:
Phase 1 (Start with simple components):

Footer, NetworkStatus, SocialShare - minimal logic, good learning
Phase 2 (Medium complexity):

CookieConsent, CookieCustomize - modal management like ThemePicker
Navigation - event handling, state management
Phase 3 (Complex):

Carousel - Embla integration, multiple instances
Hero - GSAP timeline management
EmbedManager - lazy loading, intersection observer
Template Pattern:

export class ComponentName extends HTMLElement {  private cleanup: Array<() => void> = []    connectedCallback() {    if (document.readyState === 'loading') {      document.addEventListener('DOMContentLoaded', () => this.initialize())    } else {      this.initialize()    }  }    private initialize() {    // Nanostores    this.cleanup.push($store.subscribe(val => this.update(val)))        // Animation events    this.cleanup.push(onAnimationEvent(OVERLAY_OPENED, () => this.pause()))        // DOM events    this.button.addEventListener('click', this.handleClick)    this.cleanup.push(() => this.button.removeEventListener('click', this.handleClick))  }    disconnectedCallback() {    this.cleanup.forEach(fn => fn())  }}
Why Not Frameworks Here:
Your components are imperative (DOM manipulation, timelines, observers) not declarative (state → UI)
Adding React/Preact brings reactive overhead for components that don't need it
transition:persist works natively with Web Components, requires workarounds with frameworks
Your codebase is already "vanilla-first" - Web Components continue this philosophy
Bottom line: Web Components are the natural evolution of your current architecture, proven by ThemePicker success, with zero philosophical or technical conflicts.