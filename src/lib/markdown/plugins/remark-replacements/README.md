# Remark Replacements Plugin

A remark plugin that provides typographic replacements for arrows, fractions, and mathematical symbols in markdown content. This plugin complements [remark-smartypants](https://github.com/silvenon/remark-smartypants) (which handles quotes, dashes, and ellipses) by adding additional typographic enhancements.

## Features

### Arrow Replacements

The plugin converts ASCII arrow representations to proper Unicode arrow characters:

| Input | Output | Unicode | Description |
|-------|--------|---------|-------------|
| `-->` | → | U+2192 | Rightwards arrow |
| `<--` | ← | U+2190 | Leftwards arrow |
| `<-->` | ↔ | U+2194 | Left-right arrow |
| `==>` | ⇒ | U+21D2 | Rightwards double arrow |
| `<==` | ⇐ | U+21D0 | Leftwards double arrow |
| `<==>` | ⇔ | U+21D4 | Left-right double arrow |

### Mathematical Symbol Replacements

| Input | Output | Unicode | Description |
|-------|--------|---------|-------------|
| `+-` | ± | U+00B1 | Plus-minus sign |
| `2 x 4` | 2 × 4 | U+00D7 | Multiplication sign |

**Note:** The multiplication replacement preserves spacing and works with any numbers.

### Fraction Replacements

| Input | Output | Unicode | Description |
|-------|--------|---------|-------------|
| `1/2` | ½ | U+00BD | Vulgar fraction one half |
| `1/4` | ¼ | U+00BC | Vulgar fraction one quarter |
| `3/4` | ¾ | U+00BE | Vulgar fraction three quarters |

**Note:** Fraction replacements only match when surrounded by word boundaries to avoid replacing file paths like `src/lib/utils` or code snippets.

## Usage

### Basic Usage

The plugin is automatically enabled in the Astro markdown configuration:

```typescript
// src/lib/config/markdown.ts
import remarkReplacements from '../markdown/plugins/remark-replacements/index'

export const markdownConfig = {
  remarkPlugins: [
    // ... other plugins
    remarkReplacements, // Uses all default rules
    // ... other plugins
  ]
}
```

### Advanced Configuration

You can customize which replacements are enabled:

```typescript
import remarkReplacements from '../markdown/plugins/remark-replacements/index'

export const markdownConfig = {
  remarkPlugins: [
    [remarkReplacements, {
      disable: ['multiplication'], // Disable specific rules
      debug: true, // Enable debug logging
    }],
  ]
}
```

#### Available Rule Names

- `arrow_right` - Converts `-->`
- `arrow_left` - Converts `<--`
- `arrow_both` - Converts `<-->`
- `double_arrow_right` - Converts `==>`
- `double_arrow_left` - Converts `<==`
- `double_arrow_both` - Converts `<==>`
- `plusminus` - Converts `+-`
- `onehalf` - Converts `1/2`
- `onequarter` - Converts `1/4`
- `threequarters` - Converts `3/4`
- `multiplication` - Converts `2 x 4` pattern

## Examples

### In Markdown Content

```markdown
## Data Flow

User input --> Validation --> Processing ==> Database

The algorithm runs in O(n) time +- constant factors.

## Measurements

- Mix 1/2 cup flour with 1/4 cup sugar
- Grid dimensions: 3 x 4 meters
- Temperature: 20°C +- 2°C
```

### Rendered Output

**Data Flow**

User input → Validation → Processing ⇒ Database

The algorithm runs in O(n) time ± constant factors.

**Measurements**

- Mix ½ cup flour with ¼ cup sugar
- Grid dimensions: 3 × 4 meters
- Temperature: 20°C ± 2°C

## Code Preservation

The plugin intelligently skips code blocks and inline code:

````markdown
Arrows work in text: --> becomes an arrow

But not in code blocks:
```bash
git pull origin main --> No replacement here
```

And not in inline code: `function arrow() { return a --> b }` stays unchanged.
````

## Custom Replacement Rules

You can provide custom replacement rules:

```typescript
import remarkReplacements from '../markdown/plugins/remark-replacements/index'
import type { ReplacementRule } from '../markdown/plugins/remark-replacements/index'

const customRules: ReplacementRule[] = [
  {
    name: 'custom_arrow',
    re: /~>/g,
    sub: '⇝' // Squiggle arrow
  }
]

export const markdownConfig = {
  remarkPlugins: [
    [remarkReplacements, {
      rules: customRules,
      disable: [], // Can still disable default rules
    }],
  ]
}
```

## Implementation Details

### Safe AST Traversal

The plugin uses `unist-util-visit` to safely traverse the markdown AST and only transforms text nodes. This ensures that:

- Code blocks are never modified
- Inline code is never modified
- HTML nodes are preserved
- Only plain text content is affected

### Performance

Replacements are applied using efficient regex patterns with the global flag, processing each text node only once. The plugin adds minimal overhead to the markdown compilation process.

## TypeScript Support

Full TypeScript support is included with exported types:

```typescript
import type {
  RemarkReplacementsOptions,
  ReplacementRule,
} from '../markdown/plugins/remark-replacements/index'
```

## Testing

The plugin includes comprehensive tests covering:

- All arrow types (6 tests)
- Mathematical symbols (3 tests)
- Fraction replacements (3 tests)
- Code preservation (3 tests)
- Multiple replacements (2 tests)
- Plugin options (3 tests)
- Edge cases (6 tests)
- Real-world content (1 test)

Run tests with:

```bash
npm test -- src/lib/markdown/plugins/remark-replacements/index.spec.ts
```

## Related Plugins

This plugin is designed to work alongside:

- **remark-smartypants** - Handles quotes, dashes, and ellipses
- **remark-gfm** - GitHub Flavored Markdown extensions
- **remark-breaks** - Converts line breaks to `<br>` tags

## Migration from markdown-it

This plugin replaces the legacy `markdown-it-replacements` plugin from the Eleventy version of the site. Key improvements:

- ✅ TypeScript support
- ✅ Modern unified/remark ecosystem
- ✅ Safe AST-based transformation
- ✅ Comprehensive test coverage
- ✅ Configurable options
- ❌ Removed dangerous `allcaps` rule
- ❌ Removed redundant smartypants features

## License

Part of the Webstack Builders corporate website project.
