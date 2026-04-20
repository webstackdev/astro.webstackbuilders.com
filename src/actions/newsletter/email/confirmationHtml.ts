import confirmationTemplateContent from './confirmation.mjml?raw'
import { compileEmailTemplate, createImportedEmailTemplate } from '@actions/utils/email/templateCompiler'

const confirmationTemplate = createImportedEmailTemplate(
  'src/actions/newsletter/email/confirmation.mjml',
  confirmationTemplateContent
)

const createGreeting = (firstName?: string): string => {
  return firstName?.trim() ? `Hi ${firstName.trim()}` : 'Hello'
}

type ConfirmationTemplateData = {
  confirmUrl: string
  expiresIn: string
  greeting: string
}

const createConfirmationTemplateData = (
  firstName: string | undefined,
  confirmUrl: string,
  expiresIn: string
): ConfirmationTemplateData => ({
  confirmUrl,
  expiresIn,
  greeting: createGreeting(firstName),
})

export async function generateConfirmationEmailHtml(
  firstName: string | undefined,
  confirmUrl: string,
  expiresIn: string = '24 hours'
): Promise<string> {
  const { html } = await compileEmailTemplate(
    confirmationTemplate,
    createConfirmationTemplateData(firstName, confirmUrl, expiresIn)
  )

  return html
}

export async function generateConfirmationEmailText(
  firstName: string | undefined,
  confirmUrl: string,
  expiresIn: string = '24 hours'
): Promise<string> {
  const { text } = await compileEmailTemplate(
    confirmationTemplate,
    createConfirmationTemplateData(firstName, confirmUrl, expiresIn)
  )

  return text
}