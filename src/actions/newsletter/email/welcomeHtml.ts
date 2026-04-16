import welcomeTemplateContent from './welcome.mjml?raw'
import { compileEmailTemplate, createEmailTemplate } from '@actions/utils/email/templateCompiler'

const welcomeTemplate = createEmailTemplate(
  new URL('./welcome.mjml', import.meta.url),
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
  const { html } = await compileEmailTemplate(
    welcomeTemplate,
    createWelcomeTemplateData(firstName)
  )

  return html
}

export async function generateWelcomeEmailText(firstName?: string): Promise<string> {
  const { text } = await compileEmailTemplate(
    welcomeTemplate,
    createWelcomeTemplateData(firstName)
  )

  return text
}