export function generateConfirmationEmailHtml(
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
    <p>Read our <a href="https://www.webstackbuilders.com/privacy">Privacy Policy</a> for more information about how we handle your data.</p>
    <p>If you no longer wish to receive these emails, you can <a href="https://www.webstackbuilders.com/privacy#unsubscribe" data-testid="unsubscribe-link">unsubscribe here</a> at any time.</p>
    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      © ${new Date().getFullYear()} Webstack Builders. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim()
}
