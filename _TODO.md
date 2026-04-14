<!-- markdownlint-disable-file -->
# TODO

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway
https://aws.plainenglish.io/how-to-build-a-chatbot-using-aws-lex-and-lambda-in-2026-aeeff5e13f4a

## Link Validator

- Re-enable link validator in `astro.config.ts` when pdf / downloads sorted out

## Contact Page File Uploads

- Uppy, Tus server, whatever other server needed for file upload on Contact Form component
- Contact page Uppy file upload not displaying. Submit button is huge on Contact page.

## Header - "Squish" Effect

- Need to improve the "squish" animation where the header reduces in size on scroll down, and returns to full size on scroll up. Maybe reduce and expand the text and search / themepicker / hamburger menu sizes in place, and then slide them horizontally.
- Moving the scroll bar up quickly with the mouse seems to make the header logic break - the Switcher component and Breadcrumbs are hidden under the header
- Themepicker and search icon are too big in non-squished header. Logo too - the initial presentation should be smaller.

## Resume

- Finish styling

## Contact Form

- `0/2000` characters should show number of characters left instead

## Content Issues

We fixed the Confetti animation for the Contact page by wrapping the entire Contact form in the Confetti component - src/components/Pages/Contact/index.astro

We have the same problem of the Confetti animation being constrained to a small row of the page in the other places where it's used - the Download CTA and the Newsletter CTA layouts. But in those cases, there's no way we can wrap the page content inside the component - it's internal to the CTA components, and they're designed to be used by authors inside of article MDX files.

I think we need to refactor the Confetti component to create a canvas that uses absolute positioning the
