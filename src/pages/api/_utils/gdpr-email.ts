/**
 * DSAR (Data Subject Access Request) email service
 * Sends verification emails for data access and deletion requests using Resend
 */

import { Resend } from 'resend'

/**
 * Initialize Resend client
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
 * Send verification email for DSAR request
 *
 * @param email - User's email address
 * @param token - Verification token
 * @param requestType - Type of request (ACCESS or DELETE)
 * @returns Promise that resolves when email is sent
 */
export async function sendDSARVerificationEmail(
  email: string,
  token: string,
  requestType: 'ACCESS' | 'DELETE'
): Promise<void> {
  // Skip actual email sending in dev/test environments
  const isDevOrTest = process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test' || process.env['CI'] === 'true'

  if (isDevOrTest) {
    console.log('[DEV/TEST MODE] DSAR verification email would be sent:', { email, token, requestType })
    return
  }

  const resend = getResendClient()
  const siteUrl = getSiteUrl()
  const verifyUrl = `${siteUrl}/api/gdpr/verify?token=${token}`
  const expiresIn = '24 hours'
  const actionText = requestType === 'ACCESS' ? 'access your data' : 'delete your data'
  const subject = requestType === 'ACCESS'
    ? 'Verify Your Data Access Request'
    : 'Verify Your Data Deletion Request'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0066cc;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
      border-radius: 0 0 5px 5px;
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
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
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
  </style>
</head>
<body>
  <div class="header">
    <h1>Data ${requestType === 'ACCESS' ? 'Access' : 'Deletion'} Request</h1>
  </div>

  <div class="content">
    <p>Hello,</p>

    <p>We received a request to ${actionText} from Webstack Builders. To complete this request, please verify your email address by clicking the button below:</p>

    <center>
      <a href="${verifyUrl}" class="button">Verify Request</a>
    </center>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #0066cc;">${verifyUrl}</p>

    ${requestType === 'DELETE' ? `
    <div class="warning">
      <strong>⚠️ Important:</strong> This action will permanently delete all your data from our systems. This cannot be undone.
    </div>
    ` : ''}

    <p><strong>This link will expire in ${expiresIn}.</strong></p>

    <p>If you didn't make this request, you can safely ignore this email. No action will be taken without verification.</p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at <a href="mailto:privacy@webstackbuilders.com">privacy@webstackbuilders.com</a></p>
    <p>© ${new Date().getFullYear()} Webstack Builders. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const text = `
Data ${requestType === 'ACCESS' ? 'Access' : 'Deletion'} Request

Hello,

We received a request to ${actionText} from Webstack Builders. To complete this request, please verify your email address by visiting this link:

${verifyUrl}

${requestType === 'DELETE' ? `
⚠️ IMPORTANT: This action will permanently delete all your data from our systems. This cannot be undone.
` : ''}

This link will expire in ${expiresIn}.

If you didn't make this request, you can safely ignore this email. No action will be taken without verification.

Questions? Contact us at privacy@webstackbuilders.com

© ${new Date().getFullYear()} Webstack Builders. All rights reserved.
  `.trim()

  try {
    const result = await resend.emails.send({
      from: 'Webstack Builders <privacy@webstackbuilders.com>',
      to: email,
      subject: `${subject} - Webstack Builders`,
      html,
      text,
      tags: [
        { name: 'type', value: 'gdpr-verification' },
        { name: 'request-type', value: requestType.toLowerCase() },
      ],
    })

    if (result.error) {
      console.error('[DSAR Email] Failed to send verification:', result.error)
      throw new Error(`Failed to send verification email: ${result.error.message}`)
    }

    console.log('[DSAR Email] Verification sent successfully:', {
      email,
      requestType,
      messageId: result.data?.id,
    })
  } catch (error) {
    console.error('[DSAR Email] Error sending verification:', error)
    throw error
  }
}