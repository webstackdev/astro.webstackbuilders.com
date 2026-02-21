import { expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { TestError } from '@test/errors'
import DownloadFormFixture from '@components/Pages/Downloads/client/__tests__/__fixtures__/downloadForm.fixture.astro'
import type { DownloadFormElement } from '@components/Pages/Downloads/client'
import {
  getDownloadButtonWrapper,
  getDownloadCompanyNameInput,
  getDownloadFirstNameInput,
  getDownloadFormElement,
  getDownloadJobTitleInput,
  getDownloadLastNameInput,
  getDownloadStatusDiv,
  getDownloadSubmitButton,
  getDownloadWorkEmailInput,
} from '@components/Pages/Downloads/client/selectors'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'

export type DownloadFormModule = WebComponentModule<DownloadFormElement>

export interface DownloadFormElements {
  form: HTMLFormElement
  submitButton: HTMLButtonElement
  statusDiv: HTMLElement
  downloadButtonWrapper: HTMLElement
  firstName: HTMLInputElement
  lastName: HTMLInputElement
  workEmail: HTMLInputElement
  jobTitle: HTMLInputElement
  companyName: HTMLInputElement
}

export interface RenderDownloadFormContext {
  element: DownloadFormElement
  module: DownloadFormModule
  window: Window & typeof globalThis
  elements: DownloadFormElements
}

export type RenderDownloadFormAssertion = (
  _context: RenderDownloadFormContext
) => Promise<void> | void

export const renderDownloadForm = async (assertion: RenderDownloadFormAssertion): Promise<void> => {
  const container = await AstroContainer.create()

  await executeRender<DownloadFormModule>({
    container,
    component: DownloadFormFixture,
    moduleSpecifier: '@components/Pages/Downloads/client/index',
    selector: 'download-form',
    assert: async ({ element, module, window, renderResult }) => {
      if (!window) {
        throw new TestError('Download form tests require a DOM-like window environment')
      }

      const context: RenderDownloadFormContext = {
        element,
        module,
        window: window as Window & typeof globalThis,
        elements: {
          form: getDownloadFormElement(window.document),
          submitButton: getDownloadSubmitButton(window.document),
          statusDiv: getDownloadStatusDiv(window.document),
          downloadButtonWrapper: getDownloadButtonWrapper(window.document),
          firstName: getDownloadFirstNameInput(window.document),
          lastName: getDownloadLastNameInput(window.document),
          workEmail: getDownloadWorkEmailInput(window.document),
          jobTitle: getDownloadJobTitleInput(window.document),
          companyName: getDownloadCompanyNameInput(window.document),
        },
      }

      expect(renderResult).toContain(`<${module.registeredName}`)
      await assertion(context)
    },
  })
}
