export function generateWelcomeEmailText(
  firstName: string | undefined,
): string {
  const greeting = firstName ? `Hi ${firstName}` : 'Hello'

  return `
Webstack Builders - Welcome!

${greeting},

Your subscription is now confirmed! Thank you for joining our community of developers, designers, and tech enthusiasts.

You'll now receive our latest articles, tutorials, and insights directly in your inbox. We're committed to delivering high-quality content that helps you build better web experiences.

Browse our articles: https://www.webstackbuilders.com/articles

WHAT TO EXPECT:
- Weekly articles on web development, design, and best practices
- Tutorials and guides for modern web technologies
- Case studies and real-world examples
- Occasional updates about new features and offerings

Need to manage your subscription? You can unsubscribe at any time using the link at the bottom of any email we send you.
Unsubscribe: https://www.webstackbuilders.com/privacy#unsubscribe

Questions? Reply to this email or contact us at hello@webstackbuilders.com

© ${new Date().getFullYear()} Webstack Builders. All rights reserved.
`.trim()
}
