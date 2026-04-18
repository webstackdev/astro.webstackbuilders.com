import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { ActionsFunctionError } from '@actions/utils/errors'
import contactMessageTemplateContent from '../../../contact/email/message.mjml?raw'
import exampleTemplateContent from '../__fixtures__/example.mjml?raw'
import invalidTemplateContent from '../__fixtures__/invalid.mjml?raw'
import withCommonDataTemplateContent from '../__fixtures__/with-common-data.mjml?raw'
import { compileEmailTemplate, createEmailTemplate } from '../templateCompiler'

const exampleTemplate = createEmailTemplate(
  new URL('../__fixtures__/example.mjml', import.meta.url),
  exampleTemplateContent
)

const invalidTemplate = createEmailTemplate(
  new URL('../__fixtures__/invalid.mjml', import.meta.url),
  invalidTemplateContent
)

const contactMessageTemplate = createEmailTemplate(
  new URL('../../../contact/email/message.mjml', import.meta.url),
  contactMessageTemplateContent
)

const withCommonDataTemplate = createEmailTemplate(
  new URL('../__fixtures__/with-common-data.mjml', import.meta.url),
  withCommonDataTemplateContent
)

describe('compileEmailTemplate', () => {
  it('compiles the moved contact message template from its imported source', async () => {
    const result = await compileEmailTemplate(contactMessageTemplate, {
      attachments: [{ filename: 'brief.pdf', sizeLabel: '2.4 MB' }],
      consentGiven: 'Yes',
      fields: [
        { label: 'Name', value: 'Alex Example' },
        { label: 'Email', value: 'alex@example.com' },
      ],
      messageHtml: 'Need help with a launch plan.<br>Timeline is flexible.',
    })

    const dom = new JSDOM(result.html)

    expect(dom.window.document.querySelector('html')).not.toBeNull()
    expect(dom.window.document.querySelector('head')).not.toBeNull()
    expect(dom.window.document.querySelector('body')).not.toBeNull()
    expect(dom.window.document.querySelectorAll('table').length).toBeGreaterThan(0)
    expect(dom.window.document.body.textContent ?? '').toContain('Alex Example')
    expect(dom.window.document.body.textContent ?? '').toContain('brief.pdf (2.4 MB)')
    expect(result.text).toContain('Need help with a launch plan.')
    expect(result.text).toContain('Timeline is flexible.')
    expect(result.text).toContain('Alex Example')
    expect(result.text).toContain('brief.pdf (2.4 MB)')
  })

  it('renders nunjucks data and returns html and plain text', async () => {
    const result = await compileEmailTemplate(exampleTemplate, {
      htmlMessage: '<strong>Urgent</strong> message body',
      items: ['Coffee Beans', 'Espresso Machine'],
      name: '<Alex & Co>',
    })

    expect(result.html).toContain('Hello, &lt;Alex &amp; Co&gt;!')
    expect(result.html).toContain('Coffee Beans')
    expect(result.html).toContain('<strong>Urgent</strong> message body')
    expect(result.html).toContain('privacy policy')

    expect(result.text).toContain('Hello, <Alex & Co>!')
    expect(result.text).toContain('We found 2 items for you:')
    expect(result.text).toContain('Coffee Beans')
    expect(result.text).toContain('Espresso Machine')
    expect(result.text).toContain('Urgent message body')
    expect(result.text).toContain('privacy policy')
  })

  it('injects common contact data into inline fixture content', async () => {
    const result = await compileEmailTemplate(withCommonDataTemplate, {
      name: 'Alex',
    })

    expect(result.html).toContain('Hello, Alex!')
    expect(result.html).toContain('www.webstackbuilders.com')
    expect(result.html).toContain('https://www.webstackbuilders.com')
    expect(result.html).toContain('Contact Webstack Builders at')
    expect(result.html).toContain('support@webstackbuilders.com')

    expect(result.text).toContain('Hello, Alex!')
    expect(result.text).toContain('Visit www.webstackbuilders.com [https://www.webstackbuilders.com].')
    expect(result.text).toContain('Contact Webstack Builders at support@webstackbuilders.com.')
  })

  it('throws ActionsFunctionError when MJML compilation reports errors', async () => {
    await expect(compileEmailTemplate(invalidTemplate)).rejects.toMatchObject({
      appCode: 'EMAIL_TEMPLATE_COMPILE_FAILED',
      details: expect.objectContaining({
        templatePath: 'src/actions/utils/email/__fixtures__/invalid.mjml',
      }),
      name: 'ActionsFunctionError',
      operation: 'compileEmailTemplate',
      route: 'actions:utils:email',
      status: 500,
    })
  })

  it('throws ActionsFunctionError when the template path is outside the project root', async () => {
    expect(() => createEmailTemplate('/tmp/outside-project-template.mjml', '<mjml />')).toThrow(
      expect.objectContaining({
        appCode: 'EMAIL_TEMPLATE_PATH_INVALID',
        name: 'ActionsFunctionError',
      })
    )
  })

  it('wraps unexpected render failures in ActionsFunctionError', async () => {
    const brokenTemplate = createEmailTemplate(
      new URL('../__fixtures__/example.mjml', import.meta.url),
      '{% if name %}{{ name }'
    )

    await expect(compileEmailTemplate(brokenTemplate)).rejects.toBeInstanceOf(ActionsFunctionError)
    await expect(compileEmailTemplate(brokenTemplate)).rejects.toMatchObject({
      appCode: 'EMAIL_TEMPLATE_RENDER_FAILED',
      details: {
        templatePath: fileURLToPath(new URL('../__fixtures__/example.mjml', import.meta.url)),
      },
      operation: 'compileEmailTemplate',
      route: 'actions:utils:email',
      status: 500,
    })
  })
})