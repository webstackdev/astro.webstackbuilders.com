<!-- markdownlint-disable-file -->
# TODO

## Bot Detection

We added a honeypot. Further options are Cloudflare Turnstile and Google Recaptcha v3. I added notes in CONTACT_BOT_DETECTION.md for implementation.

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
- Workflow right now puts the "Success" toast under the submit button when the submit button returns to normal after a submission. It seems like the button should have some time out after a successful submission to make sure it's not hammered, like five seconds. And it just looks visually odd - maybe the button should be part of the layout of the success toast, or moved down under it.

## Newsletter / MJML Templates

- Need to move the unsubscribe link into an Action and handle it entirely within our website instead of on Hubspot
- Need to add a newsletter publishing workflow as an action, using the newsletter static segment imported from Hubspot
