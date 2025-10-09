# Icons

This directory contains SVG icons used throughout the project with the [astro-icon](https://www.astroicon.dev/) system.

## Adding New Icons

To add a new icon to the project:

### 1. Add the SVG file

Place your SVG file in this directory (`src/icons/`). Use kebab-case naming (e.g., `my-new-icon.svg`).

**SVG Format Requirements:**

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <!-- Your icon content -->
</svg>
```

### 2. Update TypeScript definitions

After adding a new SVG file, you **must** update the `src/@types/icons.ts` file to include the new icon name in the `IconName` union type:

```typescript
export type IconName =
  | 'alarm-clock'
  | 'arrow-down'
  // ... existing icons
  | 'my-new-icon'  // Add your new icon here
  | 'warning';
```

This provides TypeScript autocomplete and prevents typos when using icons in components.

### 3. Use the icon

Import and use the `Sprite` component:

```astro
---
import Sprite from '@components/Sprite.astro'
---

<Sprite name="my-new-icon" class="h-6 w-6" />
```

## Icon Usage

The `Sprite` component accepts these props:

- `name` (required): The icon name (must match a file in `src/icons/` and be defined in `IconName` type)
- `class`: CSS classes to apply
- `size`: Icon size (defaults to 24)

## Theming

Icons integrate with the site's theming system via CSS custom properties:

```css
/* In src/styles/sprites.css */
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

| Icon | Name | Description |
|------|------|-------------|
| ![alarm-clock](./alarm-clock.svg) | `alarm-clock` | Clock/time icon |
| ![arrow-down](./arrow-down.svg) | `arrow-down` | Downward arrow |
| ![arrow-right](./arrow-right.svg) | `arrow-right` | Rightward arrow |
| ![award](./award.svg) | `award` | Award/achievement icon |
| ![check](./check.svg) | `check` | Checkmark |
| ![close](./close.svg) | `close` | Close/X button |
| ![codepen](./codepen.svg) | `codepen` | CodePen social icon |
| ![external](./external.svg) | `external` | External link indicator |
| ![feed](./feed.svg) | `feed` | RSS/feed icon |
| ![github](./github.svg) | `github` | GitHub social icon |
| ![heart](./heart.svg) | `heart` | Heart/favorite icon |
| ![info](./info.svg) | `info` | Information icon |
| ![keybase](./keybase.svg) | `keybase` | Keybase social icon |
| ![lightbulb](./lightbulb.svg) | `lightbulb` | Idea/lightbulb icon |
| ![linkedin](./linkedin.svg) | `linkedin` | LinkedIn social icon |
| ![message](./message.svg) | `message` | Message/chat icon |
| ![paper-and-pencil](./paper-and-pencil.svg) | `paper-and-pencil` | Writing/editing icon |
| ![paper-clip](./paper-clip.svg) | `paper-clip` | Attachment icon |
| ![question](./question.svg) | `question` | Question/help icon |
| ![repost](./repost.svg) | `repost` | Repost/share icon |
| ![twitter](./twitter.svg) | `twitter` | Twitter/X social icon |
| ![warning](./warning.svg) | `warning` | Warning/alert icon |

---

**Important:** Always update `src/@types/icons.ts` when adding new icons to maintain TypeScript safety and autocomplete functionality.

