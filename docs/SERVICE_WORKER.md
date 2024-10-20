# Service Workers

## Streaming Service Worker for Precaching

This strategy avoids reloading the page template with inline SVGs and styles. It would allow inlining all Javascript and stylesheets as well. For a static Eleventy site, it requires generating two versions of each page: one version will contain the full page markup, while the other will contain only the content.

- Create a file containing only your website's header markup.
- Create a file containing only your website's footer markup.
- Pull out each page's main content into a separate file, or set up your back end to conditionally serve only the page content based on an HTTP request header.

Be careful for `<title>`, `<link>`, and `<meta>` tags that vary between pages.

[Google Article on Streaming Service Worker Setup](https://developer.chrome.com/docs/workbox/faster-multipage-applications-with-streams/)

## BFCache

Never add an `unload` event listener. It prevents pages from being cached in the modern `bfcache` system.

Use the `pagehide` event. The `pagehide` event fires in all cases where the `unload` event
currently fires, and it also fires when a page is put in the bfcache.

Close connections and remove or disconnect observers during the `pagehide` or `freeze` events,
including open `IndexedDB` connections, in-progress `fetch()` or `XMLHttpRequest`, and open
`WebSocket` or `WebRTC` connections. If the page is restored from the bfcache, you can re-open
or re-connect to those APIs on the `pageshow` or `resume` events.
