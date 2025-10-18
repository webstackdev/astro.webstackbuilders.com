# Downloads Component

A gated content system for offering downloadable resources (whitepapers, ebooks, guides) in exchange for user contact information.

## Overview

The Downloads content type provides a complete lead generation system with:

- **Content Management**: Markdown-based content with frontmatter metadata
- **Gated Access**: Contact form required before downloads
- **Lead Capture**: First name, last name, work email, job title, company name
- **Responsive Design**: Mobile-friendly form and layout
- **Browser Autofill**: Uses standard HTML autocomplete attributes
- **API Integration**: Ready for CRM/marketing automation integration

## Architecture

### Content Structure

```text
src/content/downloads/
├── resource-name-1/
│   ├── index.md          # Main content
│   └── cover.jpg         # Cover image (optional)
├── resource-name-2/
│   └── index.md
```

### Components

1. **DownloadForm** (`src/components/Forms/Download/index.astro`)
   - Standalone form component
   - Client-side validation
   - API submission handling
   - Success/error messaging
   - Autofill support

2. **Download Template** (`src/pages/downloads/[...slug].astro`)
   - Individual download page layout
   - Resource metadata display
   - Content rendering
   - Integrated form

3. **API Endpoint** (`src/pages/api/downloads/submit.ts`)
   - Form submission handler
   - Validation
   - Integration point for external services

## Content Schema

```typescript
{
  title: string                    // Resource title
  description: string              // SEO and display description
  author: reference('authors')     // Optional author reference
  tags: string[]                   // Topic tags
  image: {
    src: string                    // Cover image URL
    alt: string                    // Image alt text
  }
  publishDate: Date                // Publication date
  isDraft: boolean                 // Draft status (default: false)
  featured: boolean                // Featured flag (default: false)
  fileType: string                 // 'PDF' | 'eBook' | 'Whitepaper' | 'Guide' | 'Report' | 'Template'
  fileSize?: string                // e.g., "2.3 MB"
  pages?: number                   // Page count
  readingTime?: string             // e.g., "30 min read"
}
```

## Usage

### Creating a New Download

1. Create a new directory in `src/content/downloads/`:

```bash
mkdir src/content/downloads/my-resource
```

1. Create `index.md` with frontmatter:

```markdown
---
title: "My Resource Title"
description: "A compelling description of what readers will learn"
author: "kevin-brown"
tags: ["topic1", "topic2"]
image:
  src: "/assets/images/downloads/my-resource.jpg"
  alt: "Resource cover description"
publishDate: 2025-01-15
isDraft: false
featured: true
fileType: "Whitepaper"
fileSize: "2.3 MB"
pages: 24
readingTime: "30 min read"
---

## Content Here

Your markdown content...
```

1. Add cover image (optional):

```bash
cp cover.jpg src/content/downloads/my-resource/
```

### Using the DownloadForm Component

```astro
---
import DownloadForm from '@components/Forms/Download/index.astro'
---

<DownloadForm
  title="Resource Name"
  fileType="Whitepaper"
  downloadUrl="https://example.com/download/file.pdf"
/>
```

**Props:**

- `title` (required): Display name of the resource
- `fileType` (optional): Type label (default: "resource")
- `downloadUrl` (optional): URL to download after form submission
- `className` (optional): Additional CSS classes

## Form Fields

All form fields use HTML5 autocomplete attributes for browser autofill:

| Field | Type | Required | Autocomplete |
|-------|------|----------|--------------|
| First Name | text | Yes | `given-name` |
| Last Name | text | Yes | `family-name` |
| Work Email | email | Yes | `email` |
| Job Title | text | Yes | `organization-title` |
| Company Name | text | Yes | `organization` |

## API Integration

### Current Implementation

The API endpoint at `/api/downloads/submit` currently logs submissions to the console. To integrate with your CRM or marketing automation platform:

1. Edit `src/pages/api/downloads/submit.ts`
2. Add integration code in the TODO sections:

```typescript
// TODO: Integrate with email service (e.g., SendGrid, Mailchimp, HubSpot)
// Example:
await sendToMailchimp({
  email: data.workEmail,
  firstName: data.firstName,
  lastName: data.lastName,
  // ...
})

// TODO: Store submission in database or CRM
// Example:
await hubspot.contacts.create({
  properties: {
    email: data.workEmail,
    firstname: data.firstName,
    lastname: data.lastName,
    jobtitle: data.jobTitle,
    company: data.companyName,
  }
})
```

### Integration Examples

#### HubSpot

```typescript
import { Client } from '@hubspot/api-client'

const hubspot = new Client({ accessToken: process.env.HUBSPOT_TOKEN })

await hubspot.crm.contacts.basicApi.create({
  properties: {
    email: data.workEmail,
    firstname: data.firstName,
    lastname: data.lastName,
    jobtitle: data.jobTitle,
    company: data.companyName,
  }
})
```

#### Mailchimp

```typescript
import mailchimp from '@mailchimp/mailchimp_marketing'

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
})

await mailchimp.lists.addListMember(LIST_ID, {
  email_address: data.workEmail,
  status: 'subscribed',
  merge_fields: {
    FNAME: data.firstName,
    LNAME: data.lastName,
    JOBTITLE: data.jobTitle,
    COMPANY: data.companyName,
  }
})
```

#### SendGrid

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

await sgMail.send({
  to: 'leads@yourcompany.com',
  from: 'downloads@yourcompany.com',
  subject: 'New Download Lead',
  text: `New lead from ${data.firstName} ${data.lastName} at ${data.companyName}`,
  html: `<strong>Contact Details:</strong><br>
         Name: ${data.firstName} ${data.lastName}<br>
         Email: ${data.workEmail}<br>
         Job Title: ${data.jobTitle}<br>
         Company: ${data.companyName}`,
})
```

## Styling

The form uses CSS custom properties for theming:

```css
--color-bg                /* Form background */
--color-text              /* Primary text color */
--color-text-offset       /* Secondary text color */
--color-border            /* Border color */
--color-primary           /* Primary action color */
--color-success-bg        /* Success message background */
--color-success-text      /* Success message text */
--color-error-bg          /* Error message background */
--color-error-text        /* Error message text */
```

## Analytics

Track form interactions by adding event listeners:

```javascript
document.getElementById('downloadForm').addEventListener('submit', () => {
  // Track with your analytics platform
  analytics.track('Download Form Submitted', {
    resource: 'Resource Name',
    // ...
  })
})
```

## SEO Considerations

Each download page includes:

- Structured metadata (title, description, image)
- Author attribution
- Publication date
- Topic tags
- Proper heading hierarchy
- Alt text for images

## Future Enhancements

Potential improvements to consider:

1. **Progress Indicator**: Multi-step form for longer forms
2. **Social Proof**: Show download count or testimonials
3. **Email Verification**: Send download link via email
4. **A/B Testing**: Test form variations for conversion optimization
5. **GDPR Compliance**: Add explicit consent checkboxes for EU users
6. **Download Tracking**: Track who downloads what and when
7. **Personalization**: Return visitors see simplified form
8. **Lead Scoring**: Assign scores based on company domain, job title
9. **Conditional Fields**: Show/hide fields based on previous answers
10. **File Hosting**: Integrate with secure file storage (AWS S3, etc.)

## Testing

Test the download flow:

1. Navigate to `/downloads/[slug]`
2. Fill out the form with valid data
3. Submit and verify:
   - Success message displays
   - Form resets
   - Download initiates (if `downloadUrl` provided)
   - API endpoint logs submission

## Accessibility

The form includes:

- Proper label associations
- Required field indicators
- ARIA live regions for status messages
- Keyboard navigation support
- Focus management
- Error messaging

## Browser Support

Autofill works in:

- Chrome 14+
- Firefox 4+
- Safari 5.1+
- Edge 12+

## License

Part of the Webstack Builders corporate website.
