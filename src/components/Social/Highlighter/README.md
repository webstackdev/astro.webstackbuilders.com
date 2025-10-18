# Highlighter Component

A shareable text highlighter component for MDX that displays a hover dialog with social sharing options.

## Features

- **Web Component** with Shadow DOM for style encapsulation
- **LoadableScript Pattern** for delayed initialization (optimized LCP)
- **Native Share API** support for mobile devices
- **Platform-specific intents** for desktop sharing (X, LinkedIn, Bluesky, Reddit)
- **Copy to clipboard** fallback with visual feedback
- **Full accessibility** with ARIA labels and keyboard navigation
- **Event-driven architecture** with custom events for tracking
- **Theme-aware styling** using CSS custom properties

## Usage

### In MDX Files

```mdx
import { Highlighter } from '@components/Social/Highlighter'

This is <Highlighter>shareable text</Highlighter> that shows share options on hover.
```

### With Custom Label

```mdx
<Highlighter ariaLabel="Share this insight">important insight</Highlighter>
```

### With Additional Classes

```mdx
<Highlighter class="font-bold">emphasized shareable text</Highlighter>
```

## Behavior

1. **Hover/Focus**: Shows share dialog above the highlighted text
2. **Click Platform Button**: Opens share intent or uses Native Share API
3. **Click Copy Button**: Copies text + URL to clipboard with visual confirmation
4. **Keyboard Navigation**:
   - `Enter` or `Space`: Show dialog
   - `Escape`: Hide dialog

## Custom Events

Listen for share actions:

```javascript
document.addEventListener('highlighter:share', (event) => {
  console.log('Shared via:', event.detail.platform)
  console.log('Share data:', event.detail.data)
})
```

## Shared Platform Configuration

Uses `src/components/Social/common/platforms.ts` for consistent platform URLs across components.

Platforms supported (in priority order):

1. X (Twitter)
2. LinkedIn
3. Bluesky
4. Reddit

## Architecture

- `client.ts` - Web Component with HighlighterElement class and Highlighter LoadableScript
- `Highlighter.astro` - Astro wrapper component for MDX usage
- `index.ts` - Barrel exports
- `__tests__/client.spec.ts` - Comprehensive unit tests (37 test cases, 100% passing)

## Testing

```bash
npm run test:unit -- src/components/Social/Highlighter/__tests__/client.spec.ts
```

All 37 tests pass, covering:

- LoadableScript interface compliance
- Shadow DOM rendering
- Dialog visibility (hover, focus, keyboard)
- Platform sharing with URL encoding
- Copy to clipboard
- Native Share API
- Custom event emission
- Accessibility attributes
- Edge cases

## Browser Support

- Modern browsers with Web Components support
- Native Share API for mobile (iOS Safari, Android Chrome)
- Platform-specific intents as fallback for desktop
- Copy API with clipboard permissions
