<!-- markdownlint-disable-file -->
# TODO

## ToolTips

Need a tooltip component for consistency.

List to add tooltips to:

- Themepicker button
- Search button

These have tooltips, how are they being generated?

- "Report a Bug" in footer
- RSS feed icon in footer

- Improve `<abbr>` styling: https://codepen.io/ire/pen/NoqWpm

## HubSpot Signup Issues / Gated Content (Downloads)

- Add people who sign up for newsletter, download, or fill out contact form to Hubspot tracking. Need to configure it to remove them if they do the GDPR remove me. Also remove them from the newsletter.

- We need a gating system, where the user gets a token to be able to download a PDF and the token is checked before downloading. If a reader has already given their email address - newsletter signup, contact form, download registration, then the download CTA on short form articles should show the PDF download button instead of trying to collect email addresses again.

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
