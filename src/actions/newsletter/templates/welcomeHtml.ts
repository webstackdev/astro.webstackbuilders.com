export function generateWelcomeEmailHtml(
  firstName: string | undefined,
): string {
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'
  return `
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
      <a href="https://www.webstackbuilders.com/articles" class="button">Browse Our Articles</a>
    </div>

    <h2>What to Expect</h2>
    <ul>
      <li>Weekly articles on web development, design, and best practices</li>
      <li>Tutorials and guides for modern web technologies</li>
      <li>Case studies and real-world examples</li>
      <li>Occasional updates about new features and offerings</li>
    </ul>

    <p><strong>Need to manage your subscription?</strong> You can unsubscribe at any time using the link at the bottom of any email we send you.</p>
    <p>If you'd like to unsubscribe right now, <a href="https://www.webstackbuilders.com/privacy#unsubscribe" data-testid="unsubscribe-link">click here</a>.</p>
  </div>

  <div class="footer">
    <p>Questions? Reply to this email or contact us at <a href="mailto:hello@webstackbuilders.com">hello@webstackbuilders.com</a></p>
    <p>© ${new Date().getFullYear()} Webstack Builders. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}
