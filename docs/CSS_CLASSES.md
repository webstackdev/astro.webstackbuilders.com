# CSS/SCSS Classes, Functions, and Mixins

A summary of different reusable classes available in the project.

## Color Variables

See [ThemePicker](./THEME_PICKER.md) for information on colors.

| Theme Color Variables |
| --- |
| --color-bg |
| --color-bg-offset |
| --color-text |
| --color-text-offset |
| --color-border |
| --color-primary |
| --color-primary-offset |
| --color-secondary |
| --color-secondary-offset |
| --color-modal-background |
| --color-success |
| --color-success-offset |
| --color-info |
| --color-warning |
| --color-warning-offset |
| --color-danger |
| --color-twitter |

## Typography Variables

| Font sizes |
| --- |
| --font-size-sm |
| --font-size-default |
| --font-size-lg |
| --font-size-xl |
| --font-size-2xl |
| --font-size-3xl |
| --font-size-4xl |
| --font-size-5xl |
| --font-size-6xl |
| --font-size-7xl |

| Font weights |
| --- |
| --font-weight-normal |
| --font-weight-heavy |
| --font-weight-heavier |
| --font-weight-bold |

| Line heights |
| --- |
| --line-height-sm |
| --line-height-md |
| --line-height-default |

|  Letter spacings |
| --- |
| --letter-spacing-xs |
| --letter-spacing-sm |
| --letter-spacing-md |
| --letter-spacing-lg |
| --letter-spacing-negative-md |

## Base

### Accessibility

#### `sr-only`

Hide information intended only for screen readers from the rendered page. Useful for forms that don't include a label for every input, which will cause problems for screen readers.

#### `sr-skip-link`

The skip link is only visible on focus.

#### `.visually-hidden`

Keep the element accessible to assistive technology, while also visually removing it.

---

### Animations

---

#### `.fade-in`

Half-second fade-in transition animation. Uses `fadeInUp` keyframe.

---

### Classes

---

#### `.no-scroll`

Used by `toggleMenu()` method in Navigation script, class is toggled on `<body>`.

---
