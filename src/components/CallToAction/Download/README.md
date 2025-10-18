# Download Call-to-Action Component

A visually striking call-to-action component that encourages users to download gated resources. The component links to download landing pages where users fill out a form to access the content.

## Features

- **Theme-Aware Styling**: Adapts to site themes with CSS custom properties
- **Gradient Background**: Eye-catching gradient from primary to accent colors
- **Animated Icon**: Download icon with hover animation
- **Trust Indicators**: Shows "Instant Access", "No Credit Card Required", and "Expert Insights"
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessible**: Semantic HTML with proper ARIA labels
- **Customizable**: Flexible props for title, description, and button text

## Usage

### Basic Usage

```astro
---
import Download from '@components/CallToAction/Download/index.astro'
---

<Download resource="ransomware-recovery-kit" />
```

### Custom Content

```astro
<Download
  resource="api-tool-consolidation-whitepaper"
  title="Transform Your API Development Workflow"
  description="Download our comprehensive guide to API tool consolidation and save your team hundreds of hours."
  buttonText="Get the Free Guide"
/>
```

### With Secondary Action

```astro
<Download
  resource="lakehouse-analytics-guide"
  title="Master Lakehouse Analytics"
  description="Learn how to build modern data architectures that combine the best of data lakes and warehouses."
  buttonText="Download the Guide"
  secondaryLink={{
    href: "/services/data-architecture",
    text: "Learn More"
  }}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `resource` | `string` | ✅ Yes | - | Name of the download resource (matches folder name in `content/downloads`) |
| `title` | `string` | No | `"Download Our Free Resource"` | Main heading for the CTA |
| `description` | `string` | No | `"Get instant access to expert insights and actionable strategies."` | Supporting description text |
| `buttonText` | `string` | No | `"Download Now"` | Text for the primary download button |
| `secondaryLink` | `object` | No | `undefined` | Optional secondary action button |
| `secondaryLink.href` | `string` | - | - | URL for secondary button |
| `secondaryLink.text` | `string` | - | - | Text for secondary button |

## Resource Parameter

The `resource` prop must match the folder name of a download in `src/content/downloads/`. For example:

- `"ransomware-recovery-kit"` → `/downloads/ransomware-recovery-kit`
- `"api-tool-consolidation-whitepaper"` → `/downloads/api-tool-consolidation-whitepaper`
- `"identity-security-for-dummies"` → `/downloads/identity-security-for-dummies`

The component will construct the URL as `/downloads/{resource}` and navigate to that landing page when the button is clicked.

## Available Downloads

Current downloads in the system:

1. **API Tool Consolidation Whitepaper**
   - Resource: `api-tool-consolidation-whitepaper`
   - Type: Whitepaper
   - Pages: 24

2. **Lakehouse Analytics Guide**
   - Resource: `lakehouse-analytics-guide`
   - Type: Guide
   - Pages: 52

3. **Ransomware Recovery Kit**
   - Resource: `ransomware-recovery-kit`
   - Type: Guide
   - Pages: 36

4. **Identity Security for Dummies**
   - Resource: `identity-security-for-dummies`
   - Type: eBook
   - Pages: 42

5. **End-to-End Observability Benefits**
   - Resource: `observability-benefits-guide`
   - Type: eBook
   - Pages: 48

## Design Elements

### Visual Features

- **Gradient Background**: Uses primary and accent theme colors
- **Decorative Blurs**: Subtle circular blur elements for depth
- **Icon Badge**: Large download icon with semi-transparent background
- **Hover Effects**: Smooth transitions and subtle lift on hover
- **Trust Indicators**: Three icons with benefits displayed below the CTA

### Accessibility

- Semantic HTML5 `<section>` element
- High contrast white text on colored background
- Focus states for keyboard navigation
- Screen reader friendly

## Customization

### Styling

The component uses CSS custom properties for theming:

- `--color-primary`: Primary brand color
- `--color-accent`: Accent color for gradients
- `--color-text`: Text color (used for button text)

### Layout

The component is full-width and should be placed within a page layout. It includes:

- Responsive padding (16-24 vertical spacing)
- Centered content container
- Max-width constraints for readability
- Flexible button layout (stacks on mobile, horizontal on desktop)

## Integration with Download System

This CTA component works seamlessly with the download system:

1. **CTA Placement**: Use in blog posts, service pages, or anywhere you want to promote a download
2. **Landing Page**: Button navigates to `/downloads/{resource}`
3. **Form Submission**: User fills out the download form on the landing page
4. **Access Granted**: After submission, download button appears
5. **PDF Download**: User clicks to download the PDF in a new tab

## Example Placements

### In an Article

```astro
---
// In src/pages/articles/api-strategy.astro
import Download from '@components/CallToAction/Download/index.astro'
---

<article>
  <!-- Article content -->

  <Download
    resource="api-tool-consolidation-whitepaper"
    title="Want to Learn More About API Consolidation?"
    description="Download our comprehensive whitepaper with case studies and implementation strategies."
  />
</article>
```

### In a Service Page

```astro
---
// In src/pages/services/security-consulting.astro
import Download from '@components/CallToAction/Download/index.astro'
---

<main>
  <!-- Service information -->

  <Download
    resource="ransomware-recovery-kit"
    title="Protect Your Organization Today"
    description="Get our complete ransomware recovery kit with prevention strategies and response protocols."
    secondaryLink={{
      href: "/contact",
      text: "Schedule Consultation"
    }}
  />
</main>
```

## Validation

The component includes runtime validation:

- Throws an error if the `resource` prop is not provided
- Ensures the component is used correctly

```typescript
if (!resource) {
  throw new Error('Download CTA component requires a "resource" prop')
}
```

## Browser Support

Works in all modern browsers that support:

- CSS Grid and Flexbox
- CSS Custom Properties (CSS Variables)
- CSS Backdrop Blur (graceful degradation)
- SVG

## Performance

- Static component with no client-side JavaScript
- Uses native HTML anchor tags for navigation
- CSS transitions handled by GPU
- Optimized SVG icons

## Related Components

- **DownloadForm** (`@components/Forms/Download/index.astro`): The form displayed on download landing pages
- **Contact CTA** (`@components/CallToAction/Contact/index.astro`): Similar CTA for contact pages
- **Newsletter CTA** (`@components/CallToAction/Newsletter/index.astro`): Newsletter subscription CTA
