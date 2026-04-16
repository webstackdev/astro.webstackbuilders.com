<!-- markdownlint-disable-file -->
# TODO

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway
https://aws.plainenglish.io/how-to-build-a-chatbot-using-aws-lex-and-lambda-in-2026-aeeff5e13f4a

## Link Validator

- Re-enable link validator in `astro.config.ts` when pdf / downloads sorted out

## Email Sending Locations

These are the files where HTML is built as string literals and then passed to Resend:

- Contact form email HTML

`src/actions/contact/responder.ts:50`
Function: `generateEmailContent(data, files)`
It returns a full <!DOCTYPE html>... string built from form fields and attachments.

- Newsletter confirmation email HTML

`src/actions/newsletter/templates/confirmationHtml.ts:1`
Function: `generateConfirmationEmailHtml(firstName, confirmUrl, expiresIn)`
Full HTML email template returned as a template literal.

- Newsletter welcome email HTML

`src/actions/newsletter/templates/welcomeHtml.ts:1`
Function: `generateWelcomeEmailHtml(firstName)`
Full HTML email template returned as a template literal.

- DSAR verification email HTML

`src/actions/gdpr/email/dsarHtml.ts:6`
Function: `dsarVerificationEmailHtml(props)`
Full HTML email template returned as a template literal.

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
