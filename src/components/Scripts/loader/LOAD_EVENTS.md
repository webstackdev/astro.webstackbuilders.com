# Load Events

## DOMContentLoaded

This event fires when the initial HTML document has been completely loaded and parsed, and the DOM tree is built. External resources like images, stylesheets, and subframes might not yet have finished loading. This is often the earliest point where scripts can safely interact with the DOM.

## load

This event fires when the entire page has finished loading, including all dependent resources such as stylesheets, images, and subframes. This is the latest point in the loading process.

## beforeunload

This event fires just before the user is about to navigate away from the page, close the browser window, or refresh the page. It can be used to prompt the user for confirmation if there are unsaved changes.

## delayed

This is a virtual event that waits for the first user interaction or five seconds to pass. It is intended for scripts that result in a layout shift and should be delayed in execution so as not to affect LCF layout in Lightouse.
