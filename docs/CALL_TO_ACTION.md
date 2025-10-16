# Call-to-Action Component Validation System

## Overview

The CallToAction (CTA) validator is an Astro integration that ensures proper usage of CTA components across your site. It provides build-time validation to prevent multiple instances of the same CTA component on a page and warns about missing CTAs on content pages.

## Features

### 🚫 **Build-Time Error Prevention**

- Prevents deployment when multiple instances of the same CTA component are found on a single page
- Automatically discovers all components in the `CallToAction` directory
- No configuration needed when adding new CTA components

### ⚠️ **Content Page CTA Warnings**

- Warns when Articles, Services, or Case Studies pages are missing Primary CTAs
- Warns when pages configured for "default" mode are missing Secondary CTAs
- Configurable per page using frontmatter options

### 🔍 **Auto-Discovery**

- Automatically detects all components in `src/components/CallToAction/`
- Generates comprehensive import pattern matching
- Supports various import styles (`@components`, relative paths, etc.)

## Current CTA Components

The system automatically tracks these components:

- **Contact** - Contact form CTA
- **Download** - Download/whitepaper CTA
- **Featured** - Featured content CTA
- **Newsletter** - Newsletter signup CTA## Installation

### 1. Add to Astro Config

```js
// astro.config.mjs
import { callToActionValidator } from './src/integrations/CtaValidator/call-to-action-validator'

export default defineConfig({
  integrations: [
    // ... other integrations
    callToActionValidator({
      // Optional: customize component path (default: 'src/components/CallToAction')
      componentPath: 'src/components/CallToAction',
      // Optional: enable debug logging (default: false)
      debug: false
    })
  ]
})
```

### 2. Configuration Options

```typescript
interface CallToActionValidatorOptions {
  /** Path to CallToAction components directory (relative to project root) */
  componentPath?: string
  /** Enable debug logging */
  debug?: boolean
  /** Additional component patterns to detect */
  additionalPatterns?: string[]
}
```

## Usage

### Page-Level Configuration

Use the `callToActionMode` frontmatter option to control CTA validation for individual pages:

```yaml
---
title: "My Article"
callToActionMode: "default"  # or "primary-only" or "none"
---
```

### CTA Mode Options

- **`"default"`** *(default)* - Requires both Primary and Secondary CTAs
- **`"primary-only"`** - Requires only Primary CTA, no secondary needed
- **`"none"`** - Disables CTA validation warnings for this page

### Content Types Validated

The integration automatically validates CTA requirements for:

- **Articles** (`/articles/*` pages)
- **Services** (`/services/*` pages)
- **Case Studies** (`/case-studies/*` pages)

Index pages and other page types are not validated.

## Primary vs Secondary CTAs

- **Primary CTA**: The first component alphabetically (currently: Contact)
- **Secondary CTA**: Any additional CTA component on the same page

The system automatically determines primary/secondary based on component names sorted alphabetically.

## Error Messages

### Build Errors (Prevents Deployment)

```text
❌ CallToAction Validator: Multiple component instances detected!

Page: /src/pages/articles/my-article.astro
  ❌ Multiple instances of 'Newsletter' component found on the same page
     └─ Line 15: <Newsletter title="Subscribe Now" />
     └─ Line 42: <Newsletter title="Don't Miss Out" />
```

### Build Warnings (Informational)

```text
⚠️  Missing primary Call-to-Action component on articles page: /src/pages/articles/example.astro
⚠️  Missing secondary Call-to-Action component on services page: /src/pages/services/consulting.astro
```

## Adding New CTA Components

1. **Create Component Directory**

   ```text
   src/components/CallToAction/NewComponent/
   ├── index.astro
   └── NewComponent.astro (optional)
   ```

2. **No Configuration Required**

   - The validator automatically discovers new components
   - Import patterns are generated automatically
   - Build validation starts immediately

3. **Component Structure**

   ```astro
   ---
   // src/components/CallToAction/NewComponent/index.astro
   export interface Props {
     title?: string
     // ... other props
   }

   const { title = "Default Title" } = Astro.props
   ---

   <div class="cta-component">
     <h3>{title}</h3>
     <!-- component content -->
   </div>
   ```

## Import Patterns Supported

The validator detects these import patterns:

```astro
<!-- Standard imports -->
import Newsletter from '@components/CallToAction/Newsletter/index.astro'
import Newsletter from '@components/CallToAction/Newsletter'
import Newsletter from 'src/components/CallToAction/Newsletter/index.astro'
import Newsletter from '../CallToAction/Newsletter'

<!-- Usage patterns -->
<Newsletter />
<Newsletter/>
<Newsletter title="Subscribe" />
```

## Debugging

Enable debug mode to see detailed information:

```js
// astro.config.mjs
callToActionValidator({
  debug: true
})
```

Debug output includes:

- Component discovery results
- Import pattern generation
- Page validation details
- CTA requirement analysis

## Best Practices

### ✅ Do's

- Use one primary CTA per content page
- Add one secondary CTA for engagement
- Use descriptive component names
- Set appropriate `callToActionMode` for special cases

### ❌ Don'ts

- Don't use multiple instances of the same CTA on one page
- Don't skip CTAs on content pages without setting `callToActionMode: "none"`
- Don't create CTA components outside the `CallToAction` directory

## Troubleshooting

### Common Issues

**Q: Build fails with "Multiple instances detected"**
A: Remove duplicate CTA components from the same page or use different CTA types.

**Q: Warnings about missing CTAs on index pages**
A: The validator only checks individual content items, not index pages. This shouldn't happen.

**Q: New component not detected**
A: Ensure the component has an `index.astro` file and restart the build process.

### Getting Help

1. Enable debug mode to see detailed validation information
2. Check that component directory structure matches expected pattern
3. Verify frontmatter `callToActionMode` is set correctly
4. Review import patterns in your pages

## Technical Details

### Integration Hooks

- **`astro:config:setup`** - Initialize configuration
- **`astro:config:done`** - Discover CTA components
- **`astro:build:start`** - Run validation checks

### File Structure

```text
src/integrations/CtaValidator/
├── call-to-action-validator.ts    # Main integration
├── __tests__/                     # Test suite
│   └── call-to-action-validator.spec.ts
└── __fixtures__/                  # Test fixtures
    └── test-data.ts
```

### Performance

- Component discovery runs once during build setup
- Page validation is file-system based, no runtime overhead
- Minimal impact on build times (< 100ms for typical projects)

---

*This system helps maintain consistency in CTA usage across your site while preventing common mistakes that could impact conversion rates.*
