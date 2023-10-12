/**
 * Visual themes used by the Theme Switcher component and script. These are used by:
 *
 * - The `components/themePicker/themes.njk` template that generates the theme card modal and items (`id` and `name` properties only)
 * - The `components/head/meta.njk` to set the <meta name="theme-color" content="CSS_COLOR" /> tag used for outside-the-page UI elements by the browser (`id` and `colors.backgroundOffset` properties only)
 * - The `components/themePicker/initial.njk` to set the window.metaColors global variable that's used to swap out the previous <meta> element when the theme is changed (`id` and `colors.backgroundOffset` properties only)
 */

/** @NOTE: These need to be kept in sync with `src/assets/scss/variables/_themes.scss` */
module.exports = [
  {
    id: 'default',
    name: 'Light',
    colors: {
      backgroundOffset: '#e2e2e2',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      backgroundOffset: '#00386d',
    },
  },
]
