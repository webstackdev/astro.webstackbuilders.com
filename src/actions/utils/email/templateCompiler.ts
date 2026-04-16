import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { convert } from 'html-to-text'
import nunjucks from 'nunjucks'
import contactContent from '@content/contact.json'
import { ActionsFunctionError } from '@actions/utils/errors'

export interface CompiledEmailTemplate {
  html: string
  text: string
}

export type EmailTemplateData = Record<string, unknown>

export interface EmailTemplateSource {
  content: string
  filePath: string
}

export interface CommonEmailTemplateData {
  currentYear: number
  company: {
    address: string
    author: {
      email: string
      emailHref: string
      name: string
    }
    city: string
    cityStatePostal: string
    country: string
    dataProtectionOfficer: {
      email: string
      emailHref: string
      name: string
    }
    description: string
    email: string
    emailHref: string
    fullAddress: string
    mapLink: string
    name: string
    postalCode: string
    social: Array<{
      blurb: string
      displayName: string
      iconName: string
      name: string
      network: string
      order: number
      url: string
    }>
    state: string
    telephoneLocal: string
    telephoneLocalHref: string
    telephoneMobile: string
    telephoneMobileHref: string
    telephoneTollFree: string
    telephoneTollFreeHref: string
    url: string
    websiteLabel: string
  }
}

interface MjmlError {
  line?: number
  message: string
  tagName?: string
}

interface MjmlRenderResult {
  html: string
  errors: MjmlError[]
}

const projectRoot = process.cwd()

const templateEnvironment = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(projectRoot, {
    noCache: true,
  }),
  {
    autoescape: true,
  }
)

const contactData = contactContent.company

const createMailtoHref = (email: string): string => `mailto:${email}`

const normalizeWebsiteLabel = (url: string): string => {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const createCommonEmailTemplateData = (): CommonEmailTemplateData => {
  const cityStatePostal = `${contactData.city}, ${contactData.state} ${contactData.index}`

  return {
    currentYear: new Date().getFullYear(),
    company: {
      address: contactData.address,
      author: {
        email: contactData.author.email,
        emailHref: createMailtoHref(contactData.author.email),
        name: contactData.author.name,
      },
      city: contactData.city,
      cityStatePostal,
      country: contactData.country,
      dataProtectionOfficer: {
        email: contactData.dataProtectionOfficer.email,
        emailHref: createMailtoHref(contactData.dataProtectionOfficer.email),
        name: contactData.dataProtectionOfficer.name,
      },
      description: contactData.description,
      email: contactData.email,
      emailHref: createMailtoHref(contactData.email),
      fullAddress: `${contactData.address}, ${cityStatePostal}`,
      mapLink: contactData.mapLink,
      name: contactData.name,
      postalCode: contactData.index,
      social: contactData.social,
      state: contactData.state,
      telephoneLocal: contactData.telephoneLocal,
      telephoneLocalHref: `tel:${contactData.telephoneLocal}`,
      telephoneMobile: contactData.telephoneMobile,
      telephoneMobileHref: `tel:${contactData.telephoneMobile}`,
      telephoneTollFree: contactData.telephoneTollFree,
      telephoneTollFreeHref: `tel:${contactData.telephoneTollFree}`,
      url: contactData.url,
      websiteLabel: normalizeWebsiteLabel(contactData.url),
    },
  }
}

const defaultCommonEmailTemplateData = createCommonEmailTemplateData()

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const mergeCommonEmailTemplateData = (data: EmailTemplateData): EmailTemplateData => {
  const commonValue = data['common']
  const commonOverrides = isRecord(commonValue) ? commonValue : {}
  const companyValue = commonOverrides['company']
  const companyOverrides = isRecord(companyValue) ? companyValue : {}

  return {
    ...data,
    common: {
      ...defaultCommonEmailTemplateData,
      ...commonOverrides,
      company: {
        ...defaultCommonEmailTemplateData.company,
        ...companyOverrides,
      },
    },
  }
}

const renderTemplateString = (template: EmailTemplateSource, data: EmailTemplateData): string => {
  const { relativePath } = normalizeTemplatePath(template.filePath)
  const nunjucksTemplate = new nunjucks.Template(
    template.content,
    templateEnvironment,
    relativePath,
    true
  )

  return nunjucksTemplate.render(mergeCommonEmailTemplateData(data))
}

const normalizeTemplatePath = (templatePath: string | URL): { absolutePath: string; relativePath: string } => {
  const rawPath = templatePath instanceof URL ? fileURLToPath(templatePath) : templatePath
  const absolutePath = isAbsolute(rawPath)
    ? rawPath
    : resolve(projectRoot, rawPath)
  const relativePath = relative(projectRoot, absolutePath).replace(/\\/g, '/')

  if (!relativePath || relativePath.startsWith('..')) {
    throw new ActionsFunctionError({
      message: 'Email template path must be inside the project root.',
      appCode: 'EMAIL_TEMPLATE_PATH_INVALID',
      status: 500,
      route: 'actions:utils:email',
      operation: 'compileEmailTemplate',
      details: {
        templatePath,
      },
    })
  }

  return {
    absolutePath,
    relativePath,
  }
}

export const createEmailTemplate = (
  filePath: string | URL,
  content: string
): EmailTemplateSource => {
  const { absolutePath } = normalizeTemplatePath(filePath)

  return {
    content,
    filePath: absolutePath,
  }
}

const createPlainText = (html: string): string =>
  convert(html, {
    wordwrap: 130,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    ],
  })

/**
 * Creates a bundle-safe template descriptor from imported MJML source.
 */
export const createImportedEmailTemplate = createEmailTemplate

/**
 * Renders imported MJML source with Nunjucks data and returns HTML plus plain text.
 */
export async function compileEmailTemplate(
  template: EmailTemplateSource,
  data: EmailTemplateData = {}
): Promise<CompiledEmailTemplate> {
  try {
    const { absolutePath, relativePath } = normalizeTemplatePath(template.filePath)
    const mjmlWithData = renderTemplateString(template, data)
    const mjmlModule = await import('mjml')
    const mjml2html = (
      'default' in mjmlModule ? mjmlModule.default : mjmlModule
    ) as (_input: string, _options?: { filePath?: string; keepComments?: boolean }) => MjmlRenderResult
    const { html, errors } = mjml2html(mjmlWithData, {
      filePath: absolutePath,
      keepComments: false,
    })

    if (errors.length > 0) {
      throw new ActionsFunctionError({
        message: 'Failed to compile MJML email template.',
        appCode: 'EMAIL_TEMPLATE_COMPILE_FAILED',
        status: 500,
        route: 'actions:utils:email',
        operation: 'compileEmailTemplate',
        details: {
          errors: errors.map((error: MjmlError) => ({
            line: error.line,
            message: error.message,
            tagName: error.tagName,
          })),
          templatePath: relativePath,
        },
      })
    }

    return {
      html,
      text: createPlainText(html),
    }
  } catch (error) {
    if (error instanceof ActionsFunctionError) {
      throw error
    }

    throw new ActionsFunctionError(error, {
      message: 'Failed to render email template.',
      appCode: 'EMAIL_TEMPLATE_RENDER_FAILED',
      status: 500,
      route: 'actions:utils:email',
      operation: 'compileEmailTemplate',
      details: {
        templatePath: template.filePath,
      },
    })
  }
}