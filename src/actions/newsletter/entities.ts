import { Resend } from 'resend'
import { getResendApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { getSiteUrl } from '@actions/utils/environment/siteUrlActions'
import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'

function getResendClient(): Resend {
  return new Resend(getResendApiKey())
}

function generateConfirmationEmailHtml(
  firstName: string | undefined,
  confirmUrl: string,
  expiresIn: string = '24 hours',
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
    <p>If you no longer wish to receive these emails, you can <a href="${getSiteUrl()}/privacy#unsubscribe" data-testid="unsubscribe-link">unsubscribe here</a> at any time.</p>
    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      © ${new Date().getFullYear()} Webstack Builders. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim()
}

function generateConfirmationEmailText(
  firstName: string | undefined,
  confirmUrl: string,
  expiresIn: string = '24 hours',
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
Unsubscribe: ${getSiteUrl()}/privacy#unsubscribe

© ${new Date().getFullYear()} Webstack Builders. All rights reserved.
  `.trim()
}

export async function sendConfirmationEmail(email: string, token: string, firstName?: string): Promise<void> {
  const siteUrl = getSiteUrl()
  const confirmUrl = `${siteUrl}/newsletter/confirm/${token}`
  const expiresIn = '24 hours'

  /** Testing helper */
  if (!isProd()) {
    console.log('[DEV/TEST MODE] Newsletter confirmation email would be sent:', { email, token })
    return
  }

  const resendPayload = {
    from: 'Webstack Builders <newsletter@webstackbuilders.com>',
    to: email,
    subject: 'Confirm your newsletter subscription - Webstack Builders',
    html: generateConfirmationEmailHtml(firstName, confirmUrl, expiresIn),
    text: generateConfirmationEmailText(firstName, confirmUrl, expiresIn),
    tags: [
      { name: 'type', value: 'newsletter-confirmation' },
      { name: 'flow', value: 'double-optin' },
    ],
  }

  const resend = getResendClient()

  try {
    const result = await resend.emails.send(resendPayload)

    if (result.error) {
      console.error('[Newsletter Email] Failed to send confirmation:', result.error)
      throw new ActionsFunctionError({
        message: `Failed to send confirmation email: ${result.error.message}`,
        appCode: 'NEWSLETTER_CONFIRMATION_EMAIL_FAILED',
        status: 502,
        route: 'actions:newsletter',
        operation: 'sendConfirmationEmail',
      })
    }
  } catch (error) {
    console.error('[Newsletter Email] Error sending confirmation:', error)
    throw new ActionsFunctionError(error, {
      message: 'Failed to send confirmation email. Please try again later.',
      appCode: 'NEWSLETTER_CONFIRMATION_EMAIL_FAILED',
      status: 502,
      route: 'actions:newsletter',
      operation: 'sendConfirmationEmail',
    })
  }
}

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
  /** Testing helper */
  if (!isProd()) {
    console.log('[DEV/TEST MODE] Newsletter welcome email would be sent:', { email })
    return
  }

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
    <p>If you'd like to unsubscribe right now, <a href="${getSiteUrl()}/privacy#unsubscribe" data-testid="unsubscribe-link">click here</a>.</p>
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
Unsubscribe: ${getSiteUrl()}/privacy#unsubscribe

Questions? Reply to this email or contact us at hello@webstackbuilders.com

© ${new Date().getFullYear()} Webstack Builders. All rights reserved.
  `.trim()

  const resendPayload = {
    from: 'Webstack Builders <newsletter@webstackbuilders.com>',
    to: email,
    subject: '🎉 Welcome to Webstack Builders!',
    html,
    text,
    tags: [
      { name: 'type', value: 'newsletter-welcome' },
      { name: 'flow', value: 'post-confirmation' },
    ],
  }

  try {
    const result = await resend.emails.send(resendPayload)

    if (result.error) {
      console.error('[Newsletter Email] Failed to send welcome email:', result.error)
      throw new ActionsFunctionError({
        message: `Failed to send welcome email: ${result.error.message}`,
        appCode: 'NEWSLETTER_WELCOME_EMAIL_FAILED',
        status: 502,
        route: 'actions:newsletter',
        operation: 'sendWelcomeEmail',
      })
    }
  } catch (error) {
    console.error('[Newsletter Email] Error sending welcome email:', error)
    throw new ActionsFunctionError(error, {
      message: 'Failed to send welcome email. Please try again later.',
      appCode: 'NEWSLETTER_WELCOME_EMAIL_FAILED',
      status: 502,
      route: 'actions:newsletter',
      operation: 'sendWelcomeEmail',
    })
  }
}
