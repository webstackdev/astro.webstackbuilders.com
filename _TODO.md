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

## GDPR Compliance for "My Data"

**Weaknesses: Missing Information for Right of Access (Article 15)**

The Right of Access is broader than just a data dump. A complete response must include specific supplementary information that your JSON currently lacks:

- Retention Periods: You must state how long you intend to keep each category of data.
- Third-Party Recipients: You must list any recipients or categories of recipients (like email service providers or analytics tools) with whom this data has been shared.
- Data Subject Rights: The response should remind the user of their other rights, such as the right to request erasure, rectification, or to lodge a complaint with a supervisory authority.
- Source of Data: While your JSON shows "source," it should explicitly confirm if any data was collected from third parties rather than the subject themselves.

**Technical Observations**

- Privacy Policy Version: Your output shows "privacyPolicyVersion": "1970-01-01". This looks like a placeholder or a Unix epoch default; ensure this reflects the actual policy version the user agreed to for each record to maintain a valid audit trail.
- Consent Text: Most records show "consentText": null. GDPR requires you to be able to demonstrate what the subject consented to; providing the actual text shown to the user at the time is a best practice for documenting valid consent.

Next Step: To be fully compliant, you should pair this JSON file with a summary document (often a PDF or HTML page) that includes the missing legal disclosures (retention, recipients, and rights) or include those fields directly in your JSON schema.

## Resume

- Finish styling

## Contact Form

- `0/2000` characters should show number of characters left instead
- Workflow right now puts the "Success" toast under the submit button when the submit button returns to normal after a submission. It seems like the button should have some time out after a successful submission to make sure it's not hammered, like five seconds. And it just looks visually odd - maybe the button should be part of the layout of the success toast, or moved down under it.

## Newsletter / MJML Templates

- Need to move the unsubscribe link into an Action and handle it entirely within our website instead of on Hubspot
- Need to add a newsletter publishing workflow as an action, using the newsletter static segment imported from Hubspot
