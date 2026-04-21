/**
 * Template for DSAR (Data Subject Access Request) verification
 * emails for data access and deletion requests.
 */
import contactContent from '@content/contact.json'
import type { DSARVerificationEmailPropsText } from '@actions/gdpr/@types'

export const dsarVerificationEmailText = (props: DSARVerificationEmailPropsText): string => {
  const { requestType, actionText, verifyUrl, expiresIn } = props
  const { company } = contactContent

  return `
Data ${requestType === 'ACCESS' ? 'Access' : 'Deletion'} Request

Hello,

We received a request to ${actionText} from ${company.name}. To complete this request, please verify your email address by visiting this link:

${verifyUrl}

${
  requestType === 'DELETE'
    ? `
⚠️ IMPORTANT: This action will permanently delete all your data from our systems. This cannot be undone.
`
    : ''
}

This link will expire in ${expiresIn}.

If you didn't make this request, you can safely ignore this email. No action will be taken without verification.

Questions? Contact us at ${company.dataProtectionOfficer.email}

© ${new Date().getFullYear()} ${company.name}. All rights reserved.
  `.trim()
}
