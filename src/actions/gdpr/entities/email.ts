import { Resend } from 'resend'
import verificationTemplateContent from '@actions/gdpr/email/verification.mjml?raw'
import { dsarVerificationEmailText } from '@actions/gdpr/email/dsarText'
import {
  compileEmailTemplate,
  createImportedEmailTemplate,
} from '@actions/utils/email/templateCompiler'
import { getResendApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { gdprReplyTo, gdprSender } from '@actions/utils/email/resendSenders'
import { getSiteUrl } from '@actions/utils/environment/siteUrlActions'
import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'

const verificationTemplate = createImportedEmailTemplate(
  'src/actions/gdpr/email/verification.mjml',
  verificationTemplateContent
)

type DsarVerificationTemplateData = {
  actionText: string
  expiresIn: string
  requestType: 'ACCESS' | 'DELETE'
  subject: string
  verifyUrl: string
}

const createDsarVerificationTemplateData = (
  requestType: 'ACCESS' | 'DELETE',
  actionText: string,
  verifyUrl: string,
  expiresIn: string,
  subject: string
): DsarVerificationTemplateData => ({
  actionText,
  expiresIn,
  requestType,
  subject,
  verifyUrl,
})

const generateDsarVerificationEmailHtml = async (
  templateData: DsarVerificationTemplateData
): Promise<string> => {
  const { html } = await compileEmailTemplate(verificationTemplate, templateData)
  return html
}

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

  const templateData = createDsarVerificationTemplateData(
    requestType,
    actionText,
    verifyUrl,
    expiresIn,
    subject
  )

  const html = await generateDsarVerificationEmailHtml(templateData)

  const text = dsarVerificationEmailText({
    requestType,
    actionText,
    verifyUrl,
    expiresIn,
  })

  try {
    const result = await resend.emails.send({
      from: gdprSender,
      replyTo: gdprReplyTo,
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
