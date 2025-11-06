// eslint-disable
/**
 * Type definitions for the generic event-driven loader.
 * Contains interfaces and types for script initialization based on DOM and user interaction events.
 */

/** The events that qualify as user interaction and should trigger executing the action. */
export type UserInteractionEvent =
  | 'keydown'
  | 'mousemove'
  | 'wheel'
  | 'touchmove'
  | 'touchstart'
  | 'touchend'

/** All supported trigger events for script execution */
/*
Components Using Trigger Events

Using 'delayed' (3 components):

- Testimonials (client.ts)
- Social Embed (client.ts)
- Highlighter (client.ts)

Using 'visible':

None - No components are currently using the 'visible' trigger event.

For reference, most other components use 'astro:page-load':

- Head
- Forms/Download
- Cookies/Consent
- Carousel
- Cookies/Customize
- Hero
- Navigation
- Toasts/NetworkStatus
- ContactForm
- CallToAction/Newsletter
- Social/Mastodon

The 'delayed' event triggers script execution after user interaction (like mousemove, keydown, wheel, touchstart, etc.), which is perfect for non-critical components like testimonials carousels, social embeds, and text highlighters that don't need to run immediately on page load.
*/
export type TriggerEvent =
  | 'delayed'
  | 'visible'
  | 'consent-gated'
  | 'astro:before-preparation'
  | 'astro:after-preparation'
  | 'astro:before-swap'
  | 'astro:after-swap'
  | 'astro:page-load'

/** Metadata for consent-gated scripts */
export type ConsentMetadata = {
  /** The consent category required for this script to execute */
  consentCategory?: 'necessary' | 'analytics' | 'advertising' | 'functional'
  /** Additional metadata for future extensibility */
  [key: string]: unknown
}

/** Abstract class for scripts that can be loaded by the Loader */
export abstract class LoadableScript {
  /** Name identifier for the script */
  public static scriptName: string
  /** The event that should trigger this script's initialization */
  public static eventType: TriggerEvent
  /** Target element selector for 'visible' event type (optional) */
  public static targetSelector?: string
  /** Metadata for conditional script loading (e.g., consent requirements) */
  public static meta: ConsentMetadata = {}

  /** Initialize the script */
  public static init(): void {
    throw new Error('Init method not implemented.')
  }
  /** Pause script execution */
  public static pause(): void {
    throw new Error('Pause method not implemented.')
  }
  /** Resume script execution */
  public static resume(): void {
    throw new Error('Resume method not implemented.')
  }
  /** Reset script execution for use on SPA page navigation */
  public static reset(): void {
    throw new Error('Reset method not implemented.')
  }
}
