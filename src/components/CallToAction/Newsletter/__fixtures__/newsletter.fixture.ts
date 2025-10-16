/**
 * Newsletter component test fixture using Astro Container API
 * Uses the actual Newsletter/index.astro component instead of hard-coded HTML
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import NewsletterComponent from '../index.astro'

export interface NewsletterProps {
  title?: string
  description?: string
  placeholder?: string
  buttonText?: string
}

/**
 * Create Newsletter component DOM using Astro Container API
 * @param props - Props to pass to the Newsletter component
 * @returns Promise<string> - Rendered HTML from the actual Astro component
 */
export async function createNewsletterDOM(props: NewsletterProps = {}): Promise<string> {
  const container = await AstroContainer.create()

  const defaultProps: NewsletterProps = {
    title: "Test Newsletter",
    description: "Test description for newsletter signup",
    placeholder: "test@example.com",
    buttonText: "Subscribe"
  }

  const finalProps = { ...defaultProps, ...props }

  return await container.renderToString(NewsletterComponent, {
    props: finalProps
  })
}

/**
 * Setup Newsletter DOM in document.body using the actual Astro component
 * @param props - Props to pass to the Newsletter component
 */
export async function setupNewsletterDOM(props: NewsletterProps = {}): Promise<void> {
  const html = await createNewsletterDOM(props)
  document.body.innerHTML = html
}

/**
 * Helper function to get form elements after DOM setup
 */
export function getFormElements() {
  return {
    form: document.getElementById('newsletter-form') as HTMLFormElement,
    emailInput: document.getElementById('newsletter-email') as HTMLInputElement,
    submitButton: document.getElementById('newsletter-submit') as HTMLButtonElement,
    buttonText: document.getElementById('button-text') as HTMLSpanElement,
    buttonArrow: document.getElementById('button-arrow') as unknown as SVGSVGElement,
    buttonSpinner: document.getElementById('button-spinner') as unknown as SVGSVGElement,
    message: document.getElementById('newsletter-message') as HTMLParagraphElement
  }
}