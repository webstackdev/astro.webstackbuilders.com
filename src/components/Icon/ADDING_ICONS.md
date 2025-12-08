# Icons

This directory contains SVG icons used throughout the project with the [astro-icon](https://www.astroicon.dev/) system.

## Adding New Icons

To add a new icon to the project:

### 1. Add the SVG file

Place your SVG file in this directory (`src/icons/`). Use kebab-case naming (e.g., `my-new-icon.svg`). SVG Icons must include a `<title>` element for ARIA purposes.

**SVG Format Requirements:**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <!-- Your icon content -->
</svg>
```

### 2. Use the icon

Import and use the `Icon` component:

```astro
---
import Icon from '@components/Icon/index.astro'
---

<Icon name="new-icon-name" />
```

## Icon Usage

The `Icon` component accepts these props:

- `name` (required): The icon name (must match a file in `src/icons/`)
- `class`: CSS classes to apply
- `size`: Icon size (defaults to 24)

## Theming

Icons integrate with the site's theming system via CSS custom properties:

```css
/* In src/styles/icons.css */
[astro-icon] {
  color: var(--color-theme-sprites);
  fill: currentColor;
}
```

## SVG Optimization

### Resizing SVGs

To shrink the canvas to the largest dimension in the bounding box:

```bash
inkscape --batch-process --export-area-drawing --export-plain-svg --export-filename=src/icons/output.svg src/icons/input.svg
```

### Inkscape Resizing Tips

1. Use the "W:" and "H:" boxes in the top toolbar with the lock icon to preserve aspect ratio
2. Ungroup and then group again after transforms
3. Export as "Plain SVG" to remove Inkscape metadata

## Available Icons

See the `testing/icons` page when running the dev server for a layout of available icons.
