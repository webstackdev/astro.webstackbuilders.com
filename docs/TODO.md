# Todos

## @TODO: Use Confetti on CTA forms

`canvas-confetti`
https://github.com/catdad/canvas-confetti
https://www.kirilv.com/canvas-confetti/

## @TODO: Use the Page Visibility API to pause videos, image carousels, and animations

Stop unnecessary processes when the user doesn’t see the page or inversely to perform background actions.

## @TODO: "Add to Calendar" button

Google Calendar, Apple Calendar,  Yahoo Calender,  Microsoft 365, Outlook, and Teams, and generate iCal/ics files (for all other calendars and cases).

https://github.com/add2cal/add-to-calendar-button
https://add-to-calendar-button.com/

## @TODO: Add Check HTML Links to test workflow

npm i -D check-html-links
npx check-html-links _site
https://github.com/modernweb-dev/rocket/tree/main/packages/check-html-links

## @TODO: Provide button to turn off animation in Hero

"Scaling/zooming animations are problematic for accessibility, as they are a common trigger for certain types of migraine. If you need to include such animations on your website, you should provide a control to allow users to turn off animations, preferably site-wide.  Also, consider making use of the prefers-reduced-motion media feature — use it to write a media query that will turn off animations if the user has reduced animation specified in their system preferences. "

## @TODO: Handle `@media (prefers-reduced-motion: reduce)`

Stop the Hero Greensocks animation when `@media (prefers-reduced-motion: reduce)`, using `window.mediaQuery()`. Handle user preference for reduced motion on animations, doing this also with a listener like for browser theme preference

```css
@media (prefers-reduced-motion) {
  /* styles to apply if the user's settings are set to reduced motion */
}
```

```typescript
const mediaQueryList = window.matchMedia('(prefers-reduced-motion)') // not sure what the inverse is to match for so that there's a listener for both the prefers-reduced-motion state and the doesn't-care state
mediaQueryList.addEventListener(event => {
  if (event.type === 'change') {}
})
```

## @TODO: Set up webmentions

This code goes in `_layouts/layouts/base.njk` after the last `<script>` tag in the document `<body>`:

```nunjucks
{%- if layout == 'layouts/articles/item' -%}
  <script src="{{ '/assets/scripts/webmentions.js' | url }}" defer></script>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
{%- endif -%}
```

There's a filter roughed out for the webmentions.

## @TODO: SCSS Use clothoid corners with border-radius

https://onotakehiko.dev/clothoid/

`@TODO: SCSS Make sure accent-color or styling for checkboxes/radio button groups is set up. Sets the colour used by checkboxes and radio buttons, as well as range fields and progress indicators. The accent colour is inherited`

```scss
:root{
  accent-color : #696;
}
```

## @TODO: SCSS Replace all `:focus pseudoselectors` with `:focus-visible`

```css
/* Focusing the button with a keyboard will show a dashed black line. */
button:focus-visible {
  outline: 4px dashed black;
}

/* Focusing the button with a mouse, touch, or stylus will show a subtle drop shadow. */
button:focus:not(:focus-visible) {
  outline: none;
  box-shadow: 1px 1px 5px rgba(1, 1, 0, .7);
}
```

## @TODO: Refactor modals

Modals should be wrapped in the `<dialog>` element and use programmatic methods to display - `showModal()` to disable the area outside of the modal (handles `esc` keypress natively) and `show()` to allow interaction outside the modal, along with `close()`.

## @TODO: Fix Favicon workflow

Right now, the `eleventy-favicon` plugin is used to generate `favicon.ico`, `favicon.svg`, and `apple-touch-icon.png` in the root directory. It provides a shortcode to use for outputting
`<link>` markup in the document head:

```nunjucks
{% favicon buildPaths.faviconSvgSourceFilename %}
```

The shortcode generates this markup, notice the iOS-specific `rel` type in the third link:

```html
<link rel="icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

SVG favicons are only supported across 74% of browsers. We have to provide a fallback version for Internet Explorer and Safari.

The plugin functionality for generating favicons should be moved to a Gulp task, and the HTML markup hard coded in `_layouts/components/head/meta.njk` so that the `<link>` tags can use conditional
media queries based on whether the user has a preference for dark mode set and their browser title
bar is therefore in a dark theme:

```html
<link
  href="/favicon--default.ico"
  rel="icon"
  media="(prefers-color-scheme: light)"
/>
<link
  href="/favicon--dark-theme.ico"
  rel="icon"
  media="(prefers-color-scheme: dark)"
/>
```

```typescript
// select the favicon 👉
const faviconEl = document.querySelector('link[rel="icon"]')

// watch for changes 🕵️
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', themeChange)

// listener 👂
function themeChange(event) {
  if (event.matches) {
    faviconEl.setAttribute('href', 'favicon-dark.png')
  } else {
    faviconEl.setAttribute('href', 'favicon-light.png')
  }
}
```

## @TODO: Theme preference handling

Are we listening for an event that the user changes their browser's theme preference, and updating our theme if they do? And is the initial theme of our site set based on the browser's theme preference? Use a listener for browser theme preference.

```css
@media (prefers-color-scheme: dark) {}
@media (prefers-color-scheme: light) {}
```

```typescript
const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
mediaQueryList.addEventListener(event => {
  if (event.type === 'change') {}
})
```

## @TODO: Add for iOS

Specifying a Launch Screen Image

On iOS, similar to native applications, you can specify a launch screen image that is displayed while your web application launches. This is especially useful when your web application is offline. By default, a screenshot of the web application the last time it was launched is used. To set another startup image, add a link element to the webpage, as in:

```html
<link rel="apple-touch-startup-image" href="/launch.png">
```
