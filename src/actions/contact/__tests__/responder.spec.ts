import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import {
  createContactAcknowledgementTemplateData,
  createContactEmailTemplateData,
  generateAcknowledgementEmailContent,
  generateEmailContent,
  getFormDataFromInput,
  parseAttachmentsFromInput,
} from '../responder'

describe('contact responder', () => {
  describe('generateEmailContent', () => {
    it('generates valid HTML with required elements', async () => {
      const html = await generateEmailContent(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme Co',
          service: 'Website redesign',
          timeline: '2-3-months',
          budget: '$5k-$10k',
          message: 'Hi team!\nWe need help <ASAP> & would like a call.',
          consent: true,
          DataSubjectId: '123e4567-e89b-12d3-a456-426614174000',
        },
        []
      )

      const dom = new JSDOM(html)
      const { document } = dom.window

      expect(document.querySelector('html')).not.toBeNull()
      expect(document.querySelector('head')).not.toBeNull()
      expect(document.querySelector('body')).not.toBeNull()

      // Content sanity checks: ensure HTML is escaped and newlines are represented.
      expect(document.documentElement.outerHTML).toContain('&lt;ASAP&gt;')
      expect(document.documentElement.outerHTML).toContain('&amp;')

      // Header copy should exist and include the sender name.
      expect(document.body.textContent ?? '').toContain('New Contact Form Submission')
      expect(document.body.textContent ?? '').toContain('Jane Doe')

      // Key fields should appear somewhere in the rendered content.
      expect(document.body.textContent ?? '').toContain('jane@example.com')
      expect(document.body.textContent ?? '').toContain('Acme Co')
      expect(document.body.textContent ?? '').toContain('Website redesign')
      expect(document.body.textContent ?? '').toContain('$5k-$10k')
    })

    it('renders attachments section when attachments exist', async () => {
      const html = await generateEmailContent(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          service: 'Website redesign',
          timeline: 'flexible',
          message: 'See attached.',
          consent: true,
        },
        [
          {
            filename: 'brief.pdf',
            content: Buffer.from('pdf-bytes'),
            contentType: 'application/pdf',
            size: 1234,
          },
        ]
      )

      const dom = new JSDOM(html)
      expect(dom.window.document.body.textContent ?? '').toContain('brief.pdf')
    })

    it('builds template data with optional fields and escaped message markup', () => {
      const templateData = createContactEmailTemplateData(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme Co',
          service: 'Website redesign',
          timeline: '2-3-months',
          budget: '$5k-$10k',
          message: 'Hi team!\nWe need help <ASAP> & would like a call.',
          consent: true,
        },
        [
          {
            filename: 'brief.pdf',
            content: Buffer.from('pdf-bytes'),
            contentType: 'application/pdf',
            size: 1234,
          },
        ]
      )

      expect(templateData.fields).toEqual([
        { label: 'Name', value: 'Jane Doe' },
        { label: 'Email', value: 'jane@example.com' },
        { label: 'Company', value: 'Acme Co' },
        { label: 'Service', value: 'Website redesign' },
        { label: 'Budget', value: '$5k-$10k' },
        { label: 'Timeline', value: '2-3-months' },
      ])
      expect(templateData.attachments).toEqual([
        { filename: 'brief.pdf', sizeLabel: '1.21 KB' },
      ])
      expect(templateData.consentGiven).toBe('Yes')
      expect(templateData.messageHtml).toContain('&lt;ASAP&gt;')
      expect(templateData.messageHtml).toContain('&amp;')
      expect(templateData.messageHtml).toContain('<br>')
    })

    it('builds acknowledgement template data from the submitter name', () => {
      const templateData = createContactAcknowledgementTemplateData(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          message: 'Hello there with enough detail.',
        },
        'info@webstackbuilders.com'
      )

      expect(templateData).toEqual({
        greeting: 'Hi Jane',
        replyToEmail: 'info@webstackbuilders.com',
      })
    })

    it('generates acknowledgement email HTML with reply instructions', async () => {
      const html = await generateAcknowledgementEmailContent(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          message: 'Hello there with enough detail.',
        },
        'info@webstackbuilders.com'
      )

      const dom = new JSDOM(html)
      const bodyText = dom.window.document.body.textContent ?? ''

      expect(bodyText).toContain('Thanks for reaching out')
      expect(bodyText).toContain('Hi Jane')
      expect(bodyText).toContain('info@webstackbuilders.com')
    })
  })

  describe('getFormDataFromInput', () => {
    it('maps input fields into normalized form data', () => {
      const input = {
        name: ' Jane ',
        email: 'jane@example.com',
        message: ' Hello ',
        company: 'Acme Co',
        service: 'Web development',
        timeline: '2-3-months',
        budget: '$5k-$10k',
        consent: true,
        DataSubjectId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const formData = getFormDataFromInput(input)

      // `getFormDataFromInput` does not trim; Zod validation handles normalization.
      expect(formData.name).toBe(' Jane ')
      expect(formData.email).toBe('jane@example.com')
      expect(formData.message).toBe(' Hello ')
      expect(formData.company).toBe('Acme Co')
      expect(formData.service).toBe('Web development')
      expect(formData.timeline).toBe('2-3-months')
      expect(formData.budget).toBe('$5k-$10k')
      expect(formData.consent).toBe(true)
      expect(formData.DataSubjectId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })
  })

  describe('parseAttachmentsFromInput', () => {
    it('returns empty array when no attachments provided', async () => {
      const attachments = await parseAttachmentsFromInput({})
      expect(attachments).toEqual([])
    })

    it('parses a File into attachment payload', async () => {
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

      const attachments = await parseAttachmentsFromInput({
        file0: file,
      })

      expect(attachments).toHaveLength(1)

      const [firstAttachment] = attachments
      if (!firstAttachment) {
        throw new Error('Expected first attachment to exist')
      }

      expect(firstAttachment.filename).toBe('hello.txt')
      expect(firstAttachment.contentType).toBe('text/plain')
      expect(firstAttachment.size).toBeGreaterThan(0)
      expect(firstAttachment.content).toBeInstanceOf(Buffer)
    })

    it('accepts browser-recorded audio with codec parameters', async () => {
      const file = new File(['audio'], 'recording.webm', { type: 'audio/webm;codecs=opus' })

      const attachments = await parseAttachmentsFromInput({
        file1: file,
      })

      expect(attachments).toHaveLength(1)
      expect(attachments[0]?.contentType).toBe('audio/webm')
      expect(attachments[0]?.filename).toBe('recording.webm')
    })

    it('rejects disallowed mime types', async () => {
      const file = new File(['x'], 'x.exe', { type: 'application/x-msdownload' })

      await expect(
        parseAttachmentsFromInput({
          file0: file,
        })
      ).rejects.toThrow(/type/i)
    })
  })
})
