<!-- markdownlint-disable-file -->
# TODO

## Print

__Recommended Print Header Format__

For printed pages, your header should shift from a navigation tool to a document identifier. Since users cannot click links or icons on paper, these elements are "cruft" that waste space and ink. A professional print header typically includes only these three elements:

- Brand Identity: A high-contrast version of your logo or the site name in plain text for brand recognition.
- Document Title: The main title of the page (usually the <h1>), ensuring the reader knows exactly what the document is.

```css
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-family: Arial, sans-serif;
      font-size: 10pt;
      color: #000;
    }

    @bottom-left {
      content: "Company Name";
      font-size: 9pt;
      color: #000;
    }

    @bottom-right {
      content: "Confidential";
      font-size: 9pt;
      color: #000;
    }
```

## PDF File Generation

- Need a workflow to generate PDF files from Markdown for downloads.

- Need a fixed cover page format that adds article title, subtitle, and date.

- Table of Contents (Workarounds)

Because the browser doesn't know which page an element (like an <h1>) will land on until the PDF is fully rendered, you cannot generate a TOC with correct page numbers in a single pass. Common workarounds include:

Paged.js Polyfill: Use the Paged.js library to handle sophisticated print layouts (like TOCs and cross-references) within the browser before Puppeteer "prints" the result.

[Paged.js](https://pagedjs.org/en/documentation/) polyfills `@page` properties, and lays out an HTML document in print format where it can have page numbers generated to update in a table of contents.

- Headers and Footers (Native Support)

Puppeteer can inject dynamic data into your headers and footers using specific CSS classes. To use this, you must set `displayHeaderFooter: true` in the `page.pdf()` options.

Dynamic Classes: Puppeteer automatically replaces these classes with actual values:
`.pageNumber`: Current page number.
`.totalPages`: Total number of pages.
`.title`: The document's `<title>` tag.
`.date`: The date the PDF was generated.

Requirements: You must provide sufficient margins (e.g.,` margin: { top: '50px', bottom: '50px' }`), or the headers/footers will be hidden behind the content.

Styling: You must use inline CSS within your `headerTemplate` or `footerTemplate` strings, as they cannot access your external stylesheet.


Maybe something like this to check if we're on the playwright PDF generation run and set the light theme:

```typescript
window.addEventListener('beforeprint', (event) => {
  console.log('Before print dialog opens, run this script.')
  // Example: change content or hide elements
  document.getElementById('hide-on-print').style.display = 'none'
})

window.addEventListener('afterprint', (event) => {
  console.log('After print dialog closes, run this script to revert changes.')
  // Example: revert changes
  document.getElementById('hide-on-print').style.display = ''
  // You can also use this event to send an AJAX request to a server for print tracking.
})
```

Or listen for changes:

```typescript
if (window.matchMedia) {
    var mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function(mql) {
        if (mql.matches) {
            // Equivalent to onbeforeprint
            console.log('Entering print mode (before print dialog)');
        } else {
            // Equivalent to onafterprint
            console.log('Exiting print mode (after print dialog)');
        }
    });
}
```

Handling Dynamic Content

If your page fetches data (like an API call) that needs to be visible in the print, the load event might fire before your data arrives. In that case, you should call  `print()` only after your data-fetching logic completes:

```typescript
async function prepareAndPrint() {
  // 1. Fetch your data or render dynamic elements
  await fetchData()
  await renderTable()

  // 2. Trigger the print dialog now that the DOM is ready
  window.print()
}

// Call this function when you want the process to start
prepareAndPrint()
```

To ensure your script has executed and the document is ready before the user prints, you should use the `beforeprint` event listener.

This event is specifically designed to run code after a print request is initiated (by Ctrl+P, the menu, or `window.print()`) but before the browser captures the page for the print preview.

The "Safe Preparation" Pattern

Since you want to ensure the document is finished loading and your script has run, you can combine a global "ready" flag with the beforeprint listener.

```typescript
let isDataReady = false;

// 1. Run your heavy loading/processing logic on page load

window.addEventListener('load', async () => {
  await myComplexScript() // Your data fetching or DOM manipulation
  isDataReady = true
})

// 2. Hook into the print intent

window.addEventListener('beforeprint', () => {
  if (!isDataReady) {
    // Optional: Warn the user or perform a last-second synchronous update
    console.warn("Print triggered before background script finished.")
  }
  prepareDOMForPrinting() // Final tweaks (hide buttons, expand sections, etc.)
})
```

How this meets your requirements:

Guaranteed Execution: The code inside beforeprint is guaranteed to finish before the print preview is generated.

Check Load Status: By using a flag (like isDataReady), you can verify if your initial "load" scripts finished. If they haven't, you can run critical logic immediately inside the beforeprint block.

Automatic Trigger: This doesn't open the print dialog itself; it just "sits and waits" for the user to trigger it manually.

Important Limitations

Synchronous Only: The `beforeprint` event does not support await. If you try to fetch data from an API inside the beforeprint listener, the print dialog will likely open before the data returns.
Best Practice: Always perform your heavy asynchronous work (API calls, massive DOM construction) on load. Use beforeprint only for synchronous UI adjustments like toggling classes or updating timestamps.

```bash
chrome --headless --print-to-pdf=book.pdf --no-margins --virtual-time-budget=1337 manuscript.html
```

The `--virtual-time-budget=NUMBER` flag defines how long4 Chrome waits between page load and printing - this allows the layout to settle and JavaScript code to run. Complex documents might require a value higher than `1337`. On some platforms, you might need to supply the `--disable-gpu` flag as well.

## ToolTips

Need a tooltip component for consistency.

List to add tooltips to:

- Themepicker button
- Search button

These have tooltips, how are they being generated?

- "Report a Bug" in footer
- RSS feed icon in footer

## Abbreviation Styling

- Improve `<abbr>` styling: https://codepen.io/ire/pen/NoqWpm

## HubSpot Signup Issues / Gated Content (Downloads)

- Add people who sign up for newsletter, download, or fill out contact form to Hubspot tracking. Need to configure it to remove them if they do the GDPR remove me. Also remove them from the newsletter.

- We need a gating system, where the user gets a token to be able to download a PDF and the token is checked before downloading. If a reader has already given their email address - newsletter signup, contact form, download registration, then the download CTA on short form articles should show the PDF download button instead of trying to collect email addresses again.

- We had this copyright statement for articles, it should be in the front matter of PDFs:

```text
Copyright © 2025 Webstack Builders, Inc.
The text, diagrams, and images in this work are licensed under CC BY-NC 4.0
All code samples in this article are licensed under the MIT License. Feel free to use, modify, and distribute them in any project.
```

## Youtube video for Backstage IDP hero on Home page

Discuss agentic AI integrations to add to Backstage

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway
https://aws.plainenglish.io/how-to-build-a-chatbot-using-aws-lex-and-lambda-in-2026-aeeff5e13f4a

## Move Docker containers to dev server from Playwright

We should start the mock containers with the dev server instead of with Playwright so that they're useable in a dev environment.

## Link Validator

- Re-enable link validator in `astro.config.ts` when pdf / downloads sorted out

## Contact Page File Uploads

- Uppy, Tus server, whatever other server needed for file upload on Contact Form component
- Contact page Uppy file upload not displaying. Submit button is huge on Contact page.

## Header - "Squish" Effect

- Need to improve the "squish" animation where the header reduces in size on scroll down, and returns to full size on scroll up. Maybe reduce and expand the text and search / themepicker / hamburger menu sizes in place, and then slide them horizontally.
- Moving the scroll bar up quickly with the mouse seems to make the header logic break - the Switcher component and Breadcrumbs are hidden under the header
- Themepicker and search icon are too big in non-squished header. Logo too - the initial presentation should be smaller.

## Content Issues

- Need an article on OpenStack

- Home page reorganization: move the "What I Deliver" box from the Hero into the Backstage image. Move the Backstage image / video to the hero.

- Add a "Preview Special" item to our Download CTA that lets the user know the Deep Dive content can be previewed in HTML format, and offer a switch to it.
