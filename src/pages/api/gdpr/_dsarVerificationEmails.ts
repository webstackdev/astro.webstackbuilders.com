/**
 * DSAR (Data Subject Access Request) email service
 * Sends verification emails for data access and deletion requests using Resend
 */
import { RESEND_API_KEY } from 'astro:env/server'
import { Resend } from 'resend'
import { getSiteUrl } from '@lib/config'
import { dsarVerificationEmailHtml } from '@content/email/dsar.html'
import { dsarVerificationEmailText } from '@content/email/dsar.text'
import { ClientScriptError } from '@components/scripts/errors'
import { isDev, isTest } from '@components/scripts/utils'

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
  if (isDev() || isTest()) {
    console.log('[DEV/TEST MODE] DSAR verification email would be sent:', { email, token, requestType })
    return
  }

  let resend: Resend
  try {
    resend = new Resend(RESEND_API_KEY)
  } catch (error) {
    const message = `[DSAR Email] Failed to initialize Resend client`
    console.error(message, error)
    throw new ClientScriptError({
      message,
      cause: error,
    })
  }

  const siteUrl = getSiteUrl()
  const verifyUrl = `${siteUrl}/api/gdpr/verify?token=${token}`
  const expiresIn = '24 hours'
  const actionText = requestType === 'ACCESS' ? 'access your data' : 'delete your data'
  const subject = requestType === 'ACCESS'
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
      const message = `[DSAR Email] Failed to send verification`
      console.error(message, result.error)
      throw new ClientScriptError({
        message,
        cause: result.error,
      })
    }

    console.log('[DSAR Email] Verification sent successfully:', {
      email,
      requestType,
      messageId: result.data?.id,
    })
  } catch (error) {
    const message = `[DSAR Email] Error sending verification`
    console.error(message, error)
    throw new ClientScriptError({
      message,
      cause: error,
    })
  }
}