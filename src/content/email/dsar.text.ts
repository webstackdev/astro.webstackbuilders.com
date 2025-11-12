/**
 * Template for DSAR (Data Subject Access Request) verification
 * emails for data access and deletion requests
 */
interface DSARVerificationEmailPropsText {
  requestType: 'ACCESS' | 'DELETE'
  actionText: string
  verifyUrl: string
  expiresIn: string
}

export const dsarVerificationEmailText = (props: DSARVerificationEmailPropsText) => {
  const { requestType, actionText, verifyUrl, expiresIn } = props
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
  return text
}
