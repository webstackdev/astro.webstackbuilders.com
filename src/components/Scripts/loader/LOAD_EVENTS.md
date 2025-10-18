# Load Events

## DOMContentLoaded

This event fires when the initial HTML document has been completely loaded and parsed, and the DOM tree is built. External resources like images, stylesheets, and subframes might not yet have finished loading. This is often the earliest point where scripts can safely interact with the DOM.

## load

This event fires when the entire page has finished loading, including all dependent resources such as stylesheets, images, and subframes. This is the latest point in the loading process. Reasons to add script to the load event:

- Ensuring all resources are available before manipulation: If your JavaScript code needs to interact with elements that depend on images or other resources being fully rendered (e.g., calculating image dimensions for a layout, or manipulating styles defined in a loaded CSS file), the "load" event guarantees these resources are present.
- Initializing third-party libraries or widgets: Many third-party JavaScript libraries or widgets require the entire page to be loaded and rendered before they can be properly initialized or displayed. Attaching their initialization code to the "load" event ensures they function correctly.
- Displaying loading animations or indicators: You can use the "load" event to hide a loading animation or message that was displayed while the page was fetching resources, revealing the fully loaded content to the user.
- Performing final setup or cleanup tasks: Any final adjustments to the page layout, data processing, or other tasks that should only occur once everything is loaded can be placed within the "load" event handler.
Sending analytics data: In some cases, you might want to send analytics data or track page load times after all resources have finished loading, providing a more complete picture of the user experience.

## beforeunload

This event fires just before the user is about to navigate away from the page, close the browser window, or refresh the page. It can be used to prompt the user for confirmation if there are unsaved changes.

## astro:page-load

A custom event dispatched by Astro's View Transitions router. It serves a similar purpose to the browser's native DOMContentLoaded event but is specifically designed to handle script execution and state re-initialization during client-side navigation facilitated by View Transitions. It is specifically designed to re-run client-side scripts after navigation within a Single-Page App (SPA)-like experience, which is enabled by Astro's View Transitions. In a standard Astro application (Multi-Page App), client-side JavaScript only runs once on the initial page load. This event is an alternative to DOMContentLoaded for use with View Transitions.

## astro:before-preparation

A signal dispatched by the Astro View Transitions router at the start of a page navigation. It runs before any new page content is loaded, allowing you to perform actions like displaying a loading spinner, preventing the navigation (e.g., for unsaved form changes), or overriding default behavior with the loader() function, which allows you to manually set the `event.newDocument` property. Correlates to the `navigation` native event.

## astro:after-preparation

Dispatched on the `window.document` after Astro has finished preparing and linking the new page's content but before the content is swapped into the document. For most purposes, the native event you would use to react after the page content is loaded is the DOMContentLoaded event. However, when using Astro's View Transitions, the DOMContentLoaded event is not triggered during client-side navigation.

## astro:before-swap

A lifecycle event in Astro's View Transitions router that fires right before the new page content is swapped into the DOM. It allows you to run code just before the visual transition happens, giving you a chance to customize the swap or modify the new document before it's displayed. This event is particularly useful for setting up page-specific styles or animations on the new content. It is the last chance for developers to interact with a page navigation just before the new content is swapped into the DOM.

## astro:after-swap event

A lifecycle event in the Astro framework that is dispatched after the contents of a page have been replaced during a client-side navigation, but before the view transition is complete. This event is part of Astro's View Transitions API, which provides a single-page application (SPA)-like feel to multi-page apps (MPAs). Key uses:

- Re-attaching event listeners: For websites that use JavaScript for interactivity, the event listeners on the old page are lost when the DOM is replaced. The astro:after-swap event allows you to re-attach these listeners to the elements on the newly swapped-in page.
- Managing state across transitions: It can be used to persist settings like dark mode across page navigation. You can set up a function to run on this event that checks a user's theme preference and applies the correct theme to the new page.
- Integrating with other libraries: Libraries like HTMX, which rely on the DOM to be processed, can be re-initialized using this event to ensure they continue to function correctly after a navigation.

## delayed

This is a virtual event that waits for the first user interaction or five seconds to pass. It is intended for scripts that result in a layout shift and should be delayed in execution so as not to affect LCF layout in Lightouse.

## visible

This is a virtual event that triggers when an element scrolls into or near the viewport, using the Intersection Observer API. It fires when the target element is 500px below the viewport (before it becomes visible to the user), allowing for preloading or lazy initialization of components.

**Configuration:**

- **Root:** `document.body` - Observes relative to the document body
- **Root Margin:** `0px 0px 500px 0px` - Triggers 500px before element enters viewport
- **Threshold:** `0.01` - Triggers when 1% of element is visible
- **Delay:** `100ms` - Throttles observer callbacks to once per 100ms

**Usage:**

Scripts using the 'visible' event type must either:

1. Provide a `targetSelector` property pointing to the element(s) to observe
2. Or ensure elements in the DOM have a `data-script` attribute matching the script name

This event is ideal for:

- Lazy loading social media embeds (fetch oEmbed data before visible)
- Deferring heavy component initialization
- Preloading content just before user sees it
- Optimizing initial page load performance

**Browser Support:** Requires IntersectionObserver API (95%+ browsers, IE11 needs polyfill)
