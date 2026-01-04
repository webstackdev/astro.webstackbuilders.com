import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import {
  generateEmailContent,
  getFormDataFromInput,
  parseAttachmentsFromInput,
} from '../responder'

describe('contact responder', () => {
  describe('generateEmailContent', () => {
    it('generates valid HTML with required elements', () => {
      const html = generateEmailContent(
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
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

      // Header should exist and include the sender name.
      expect(document.querySelector('meta[charset="utf-8"]')).not.toBeNull()
      expect(document.querySelector('h1')?.textContent ?? '').toContain('New Contact Form Submission')
      expect(document.body.textContent ?? '').toContain('Jane Doe')

      // Key fields should appear somewhere in the rendered content.
      expect(document.body.textContent ?? '').toContain('jane@example.com')
      expect(document.body.textContent ?? '').toContain('Website redesign')
      expect(document.body.textContent ?? '').toContain('$5k-$10k')
    })

    it('renders attachments section when attachments exist', () => {
      const html = generateEmailContent(
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
  })

  describe('getFormDataFromInput', () => {
    it('maps input fields into normalized form data', () => {
      const input = {
        name: ' Jane ',
        email: 'jane@example.com',
        message: ' Hello ',
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
