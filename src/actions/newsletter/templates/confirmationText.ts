export function generateConfirmationEmailText(
  firstName: string | undefined,
  confirmUrl: string,
  expiresIn: string = '24 hours'
): string {
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'

  return `
Webstack Builders - Confirm Your Subscription

${greeting},

Thank you for subscribing to the Webstack Builders newsletter! To complete your subscription and start receiving our latest articles, insights, and updates, please confirm your email address.

Confirm your subscription by clicking this link:
${confirmUrl}

WHY DID I RECEIVE THIS?
You're receiving this email because someone (hopefully you!) entered this email address on our website to subscribe to our newsletter. If you didn't request this, you can safely ignore this email.

IMPORTANT: This confirmation link expires in ${expiresIn}
For security reasons, this confirmation link will only work once and will expire after ${expiresIn}.

WHAT YOU'RE CONSENTING TO:
- Purpose: Receiving marketing emails and newsletters
- Frequency: Weekly articles and occasional updates
- Your Rights: You can unsubscribe at any time using the link in every email
- Data Usage: We'll only use your email to send you the content you signed up for

Questions? Contact us at hello@webstackbuilders.com
Privacy Policy: www.webstackbuilders.com/privacy
Unsubscribe: www.webstackbuilders.com/privacy#unsubscribe

© ${new Date().getFullYear()} Webstack Builders. All rights reserved.
  `.trim()
}
