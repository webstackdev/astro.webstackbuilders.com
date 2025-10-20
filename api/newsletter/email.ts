/**
 * Newsletter confirmation email service
 * Sends double opt-in confirmation emails using Resend
 */

import { Resend } from 'resend'

/**
 * Initialize Resend client
 * API key must be set in RESEND_API_KEY environment variable
 */
function getResendClient(): Resend {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

/**
 * Get the site URL from environment or default to localhost
 */
function getSiteUrl(): string {
  return process.env['SITE_URL'] || 'http://localhost:4321'
}

/**
 * Generate the HTML content for the confirmation email
 */
function generateConfirmationEmailHtml(
  firstName: string | undefined,
  confirmUrl: string,
  expiresIn: string = '24 hours'
): string {
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Newsletter Subscription</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #0066cc;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #0052a3;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      border-top: 2px solid #f0f0f0;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
    .expire-notice {
      color: #d97706;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Webstack Builders</div>
  </div>

  <div class="content">
    <h1>Confirm Your Subscription</h1>

    <p>${greeting},</p>

    <p>Thank you for subscribing to the Webstack Builders newsletter! To complete your subscription and start receiving our latest articles, insights, and updates, please confirm your email address.</p>

    <div style="text-align: center;">
      <a href="${confirmUrl}" class="button">Confirm My Subscription</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #0066cc; font-size: 14px;">${confirmUrl}</p>

    <div class="info-box">
      <p><strong>Why did I receive this?</strong></p>
      <p>You're receiving this email because someone (hopefully you!) entered this email address on our website to subscribe to our newsletter. If you didn't request this, you can safely ignore this email.</p>
    </div>

    <div class="info-box">
      <p class="expire-notice">⏰ This confirmation link expires in ${expiresIn}</p>
      <p style="margin-bottom: 0;">For security reasons, this confirmation link will only work once and will expire after ${expiresIn}.</p>
    </div>

    <h2>What You're Consenting To</h2>
    <ul>
      <li><strong>Purpose:</strong> Receiving marketing emails and newsletters</li>
      <li><strong>Frequency:</strong> Weekly articles and occasional updates</li>
      <li><strong>Your Rights:</strong> You can unsubscribe at any time using the link in every email</li>
      <li><strong>Data Usage:</strong> We'll only use your email to send you the content you signed up for</li>
    </ul>
  </div>

  <div class="footer">
    <p>Questions? Contact us at <a href="mailto:hello@webstackbuilders.com">hello@webstackbuilders.com</a></p>
    <p>Read our <a href="${getSiteUrl()}/privacy">Privacy Policy</a> for more information about how we handle your data.</p>
    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      © ${new Date().getFullYear()} Webstack Builders. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version of the confirmation email
 */
function generateConfirmationEmailText(
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
Privacy Policy: ${getSiteUrl()}/privacy

© ${new Date().getFullYear()} Webstack Builders. All rights reserved.
  `.trim()
}

/**
 * Send confirmation email to subscriber
 *
 * @param email - Subscriber's email address
 * @param token - Confirmation token
 * @param firstName - Optional subscriber first name for personalization
 * @returns Promise that resolves when email is sent
 * @throws {Error} If Resend API key is not configured or email fails to send
 */
export async function sendConfirmationEmail(
  email: string,
  token: string,
  firstName?: string
): Promise<void> {
  const resend = getResendClient()
  const siteUrl = getSiteUrl()
  const confirmUrl = `${siteUrl}/newsletter/confirm/${token}`
  const expiresIn = '24 hours'

  try {
    const result = await resend.emails.send({
      from: 'Webstack Builders <newsletter@webstackbuilders.com>',
      to: email,
      subject: 'Confirm your newsletter subscription - Webstack Builders',
      html: generateConfirmationEmailHtml(firstName, confirmUrl, expiresIn),
      text: generateConfirmationEmailText(firstName, confirmUrl, expiresIn),
      // Optional: Add tags for tracking
      tags: [
        { name: 'type', value: 'newsletter-confirmation' },
        { name: 'flow', value: 'double-optin' },
      ],
    })

    if (result.error) {
      console.error('[Newsletter Email] Failed to send confirmation:', result.error)
      throw new Error(`Failed to send confirmation email: ${result.error.message}`)
    }

    console.log('[Newsletter Email] Confirmation sent successfully:', {
      email,
      messageId: result.data?.id,
    })
  } catch (error) {
    console.error('[Newsletter Email] Error sending confirmation:', error)
    throw error
  }
}

/**
 * Send welcome email after subscription is confirmed
 * This is sent after the user clicks the confirmation link
 *
 * @param email - Subscriber's email address
 * @param firstName - Optional subscriber first name for personalization
 */
export async function sendWelcomeEmail(
  email: string,
  firstName?: string
): Promise<void> {
  const resend = getResendClient()
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Webstack Builders</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #0066cc;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      border-top: 2px solid #f0f0f0;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Webstack Builders</div>
  </div>

  <div class="content">
    <h1>🎉 Welcome to Webstack Builders!</h1>

    <p>${greeting},</p>

    <p>Your subscription is now confirmed! Thank you for joining our community of developers, designers, and tech enthusiasts.</p>

    <p>You'll now receive our latest articles, tutorials, and insights directly in your inbox. We're committed to delivering high-quality content that helps you build better web experiences.</p>

    <div style="text-align: center;">
      <a href="${getSiteUrl()}/articles" class="button">Browse Our Articles</a>
    </div>

    <h2>What to Expect</h2>
    <ul>
      <li>Weekly articles on web development, design, and best practices</li>
      <li>Tutorials and guides for modern web technologies</li>
      <li>Case studies and real-world examples</li>
      <li>Occasional updates about new features and offerings</li>
    </ul>

    <p><strong>Need to manage your subscription?</strong> You can unsubscribe at any time using the link at the bottom of any email we send you.</p>
  </div>

  <div class="footer">
    <p>Questions? Reply to this email or contact us at <a href="mailto:hello@webstackbuilders.com">hello@webstackbuilders.com</a></p>
    <p>© ${new Date().getFullYear()} Webstack Builders. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Webstack Builders - Welcome!

${greeting},

Your subscription is now confirmed! Thank you for joining our community of developers, designers, and tech enthusiasts.

You'll now receive our latest articles, tutorials, and insights directly in your inbox. We're committed to delivering high-quality content that helps you build better web experiences.

Browse our articles: ${getSiteUrl()}/articles

WHAT TO EXPECT:
- Weekly articles on web development, design, and best practices
- Tutorials and guides for modern web technologies
- Case studies and real-world examples
- Occasional updates about new features and offerings

Need to manage your subscription? You can unsubscribe at any time using the link at the bottom of any email we send you.

Questions? Reply to this email or contact us at hello@webstackbuilders.com

© ${new Date().getFullYear()} Webstack Builders. All rights reserved.
  `.trim()

  try {
    const result = await resend.emails.send({
      from: 'Webstack Builders <newsletter@webstackbuilders.com>',
      to: email,
      subject: '🎉 Welcome to Webstack Builders!',
      html,
      text,
      tags: [
        { name: 'type', value: 'newsletter-welcome' },
        { name: 'flow', value: 'post-confirmation' },
      ],
    })

    if (result.error) {
      console.error('[Newsletter Email] Failed to send welcome email:', result.error)
      throw new Error(`Failed to send welcome email: ${result.error.message}`)
    }

    console.log('[Newsletter Email] Welcome email sent successfully:', {
      email,
      messageId: result.data?.id,
    })
  } catch (error) {
    console.error('[Newsletter Email] Error sending welcome email:', error)
    throw error
  }
}
