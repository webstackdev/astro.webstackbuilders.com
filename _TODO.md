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

I put our default data deletion request email template in src/pages/testing/comps/scratchpad.astro
I'd like to get some design ideas for making this page nicer. You're free to generate any idea you like - add images, add sections, change the copy, anything to improve the page for its intended purpose. Add the comp as a block in a div below the existing "Default Layout" section. Since this is an email, we use mjml to generate them. That means we should restrict our CSS to styles that mjml supports / are generally supported by a wide range of email clients (but don't change it to mjml markup, we'll do that for the winning comp).

I want to add several comps, but let's do them one at a time since it's a fairly large task.
