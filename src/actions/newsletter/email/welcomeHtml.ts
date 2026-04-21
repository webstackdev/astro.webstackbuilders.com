import welcomeTemplateContent from './welcome.mjml?raw'
import {
  compileEmailTemplate,
  createImportedEmailTemplate,
} from '@actions/utils/email/templateCompiler'

const welcomeTemplate = createImportedEmailTemplate(
  'src/actions/newsletter/email/welcome.mjml',
  welcomeTemplateContent
)

const createGreeting = (firstName?: string): string => {
  return firstName?.trim() ? `Hi ${firstName.trim()}` : 'Hello'
}

type WelcomeTemplateData = {
  greeting: string
}

const createWelcomeTemplateData = (firstName?: string): WelcomeTemplateData => ({
  greeting: createGreeting(firstName),
})

export async function generateWelcomeEmailHtml(firstName?: string): Promise<string> {
  const { html } = await compileEmailTemplate(welcomeTemplate, createWelcomeTemplateData(firstName))

  return html
}

export async function generateWelcomeEmailText(firstName?: string): Promise<string> {
  const { text } = await compileEmailTemplate(welcomeTemplate, createWelcomeTemplateData(firstName))

  return text
}
