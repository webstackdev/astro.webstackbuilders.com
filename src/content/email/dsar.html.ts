/**
 * Template for DSAR (Data Subject Access Request) verification
 * emails for data access and deletion requests
 */
interface DSARVerificationEmailPropsHtml {
  subject: string
  requestType: 'ACCESS' | 'DELETE'
  actionText: string
  verifyUrl: string
  expiresIn: string
}

export const dsarVerificationEmailHtml = (props: DSARVerificationEmailPropsHtml) => {
  const { subject, requestType, actionText, verifyUrl, expiresIn } = props
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
  return html
}