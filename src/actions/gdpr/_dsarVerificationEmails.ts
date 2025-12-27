import { Resend } from 'resend'
import { dsarVerificationEmailHtml } from '@content/email/dsar.html'
import { dsarVerificationEmailText } from '@content/email/dsar.text'
import { getResendApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { getSiteUrl } from '@actions/utils/environment/siteUrlActions'
import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'

export async function sendDsarVerificationEmail(
  email: string,
  token: string,
  requestType: 'ACCESS' | 'DELETE'
): Promise<void> {
  /** Testing helper */
  if (!isProd()) {
    console.log('[DEV/TEST MODE] DSAR verification email would be sent:', {
      email,
      token,
      requestType,
    })
    return
  }

  let resend: Resend
  try {
    resend = new Resend(getResendApiKey())
  } catch (error) {
    const message = '[DSAR Email] Failed to initialize Resend client'
    console.error(message, error)
    throw new ActionsFunctionError({
      message,
      cause: error,
      code: 'DSAR_EMAIL_INIT_FAILED',
      status: 500,
      route: 'actions:gdpr',
      operation: 'sendDsarVerificationEmail',
    })
  }

  const verifyUrl = `${getSiteUrl()}/privacy/my-data?token=${token}`
  const expiresIn = '24 hours'
  const actionText = requestType === 'ACCESS' ? 'access your data' : 'delete your data'
  const subject =
    requestType === 'ACCESS'
      ? 'Verify Your Data Access Request'
      : 'Verify Your Data Deletion Request'

  const html = dsarVerificationEmailHtml({
    subject,
    requestType,
    actionText,
    verifyUrl,
    expiresIn,
  })

  const text = dsarVerificationEmailText({
    requestType,
    actionText,
    verifyUrl,
    expiresIn,
  })

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
      const message = '[DSAR Email] Failed to send verification'
      console.error(message, result.error)
      throw new ActionsFunctionError({
        message,
        cause: result.error,
        code: 'DSAR_EMAIL_SEND_FAILED',
        status: 502,
        route: 'actions:gdpr',
        operation: 'sendDsarVerificationEmail',
      })
    }

    console.log('[DSAR Email] Verification sent successfully:', {
      email,
      requestType,
      messageId: result.data?.id,
    })
  } catch (error) {
    const message = '[DSAR Email] Error sending verification'
    console.error(message, error)
    throw new ActionsFunctionError({
      message,
      cause: error,
      code: 'DSAR_EMAIL_SEND_FAILED',
      status: 502,
      route: 'actions:gdpr',
      operation: 'sendDsarVerificationEmail',
    })
  }
}
