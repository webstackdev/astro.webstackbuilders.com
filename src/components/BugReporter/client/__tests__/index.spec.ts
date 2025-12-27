import { beforeEach, describe, expect, test, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { captureFeedback } from '@sentry/browser'
import BugReporterFixture from '@components/BugReporter/client/__fixtures__/bugReporter.fixture.astro'
import type { BugReporterModalElement } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

vi.mock('@sentry/browser', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@sentry/browser')
  return {
    ...actual,
    captureFeedback: vi.fn(),
  }
})

type BugReporterModule = WebComponentModule<BugReporterModalElement>

describe('BugReporterModalElement', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    vi.clearAllMocks()
  })

  test('opens the modal when the footer trigger is clicked', async () => {
    await executeRender<BugReporterModule>({
      container,
      component: BugReporterFixture,
      moduleSpecifier: '@components/BugReporter/client/index',
      waitForReady: async (element) => {
        await element.updateComplete
      },
      assert: async ({ element, window, module, renderResult }) => {
        expect(renderResult).toContain(`<${module.registeredName}`)

        const trigger = window?.document.getElementById('bugReporterTrigger')
        expect(trigger).toBeTruthy()

        expect(element.open).toBe(false)

        trigger?.dispatchEvent(new window!.Event('click', { bubbles: true }))
        await element.updateComplete

        expect(element.open).toBe(true)
      },
    })
  })

  test('submitting the form calls captureFeedback', async () => {
    const captureFeedbackMock = vi.mocked(captureFeedback)

    await executeRender<BugReporterModule>({
      container,
      component: BugReporterFixture,
      moduleSpecifier: '@components/BugReporter/client/index',
      waitForReady: async (element) => {
        await element.updateComplete
      },
      assert: async ({ element, window }) => {
        const trigger = window?.document.getElementById('bugReporterTrigger')
        expect(trigger).toBeTruthy()

        trigger?.dispatchEvent(new window!.Event('click', { bubbles: true }))
        await element.updateComplete

        const form = window?.document.getElementById('bugReporterForm')
        expect(form).toBeTruthy()
        expect(form).toBeInstanceOf(window!.HTMLFormElement)

        const messageTextarea = (form as HTMLFormElement).querySelector('textarea[name="message"]')
        expect(messageTextarea).toBeTruthy()
        expect(messageTextarea).toBeInstanceOf(window!.HTMLTextAreaElement)

        ;(messageTextarea as HTMLTextAreaElement).value = 'The page crashed when I clicked Save.'

        form?.dispatchEvent(new window!.Event('submit', { bubbles: true, cancelable: true }))
        await element.updateComplete

        expect(captureFeedbackMock).toHaveBeenCalledTimes(1)

        const [feedbackArg, optionsArg] = captureFeedbackMock.mock.calls[0] ?? []
        expect(feedbackArg).toEqual({ message: 'The page crashed when I clicked Save.' })
        expect(optionsArg).toMatchObject({
          includeReplay: true,
          captureContext: {
            tags: {
              source: 'bug-reporter-modal',
            },
          },
        })
      },
    })
  })
})
