import { Resend } from 'resend'
import { getResendApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { getSiteUrl } from '@actions/utils/environment/siteUrlActions'
import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'
import {
  generateConfirmationEmailHtml,
  generateConfirmationEmailText,
  generateWelcomeEmailHtml,
  generateWelcomeEmailText,
} from '@actions/newsletter/templates'

function getResendClient(): Resend {
  return new Resend(getResendApiKey())
}

export async function sendConfirmationEmail(
  email: string,
  token: string,
  firstName?: string
): Promise<void> {
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

  const resendPayload = {
    from: 'Webstack Builders <newsletter@webstackbuilders.com>',
    to: email,
    subject: '🎉 Welcome to Webstack Builders!',
    html: generateWelcomeEmailHtml(firstName),
    text: generateWelcomeEmailText(firstName),
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
