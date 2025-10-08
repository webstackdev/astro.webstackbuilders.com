# Callout Component

The Callout component replaces the previous SCSS-based callout styles with a modern Astro component using Tailwind CSS.

## Usage

```astro
---
import Callout from '@components/Callout/Callout.astro';
---

<!-- Default info callout -->
<Callout>
  This is an info callout with default styling.
</Callout>

<!-- Warning callout -->
<Callout type="warning">
  This is a warning callout with primary color accent.
</Callout>

<!-- Action callout -->
<Callout type="action">
  This is an action callout, also with primary color accent.
</Callout>

<!-- Tip callout -->
<Callout type="tip">
  This is a tip callout with secondary color accent.
</Callout>

<!-- Note callout -->
<Callout type="note">
  This is a note callout with secondary color accent.
</Callout>
```

## Props

- `type`: `'warning' | 'action' | 'tip' | 'info' | 'note'` - Determines the color scheme
- `icon`: `string` - Optional icon identifier (for future implementation)

## Styling

The component uses Tailwind CSS utilities with CSS custom properties for theming:

- **Background**: `var(--color-bg-offset)`
- **Border**: `var(--color-border)` with 4px left accent border
- **Accent Colors**:
  - Warning/Action: `var(--color-primary)`
  - Tip/Info/Note: `var(--color-secondary)`

## Migration from SCSS

This component replaces the global `.callout` SCSS styles that were previously imported in `global.scss`. The styling has been converted to use Tailwind utilities while maintaining the same visual appearance and behavior.