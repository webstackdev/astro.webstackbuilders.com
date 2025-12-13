# Download Call-to-Action Component

A call-to-action component to encourage users to download gated resources. The component links to download landing pages where users fill out a form to access the content.

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
| `id` | `string` | No | `"download-cta"` | Base id used for `aria-labelledby`/`aria-describedby` relationships |
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

## Related Components

- **DownloadForm** (`@components/Forms/Download/index.astro`): The form displayed on download landing pages
- **Contact CTA** (`@components/CallToAction/Contact/index.astro`): Similar CTA for contact pages
- **Newsletter CTA** (`@components/CallToAction/Newsletter/index.astro`): Newsletter subscription CTA
