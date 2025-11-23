// @vitest-environment node
/**
 * Tests for DownloadForm HTML element selectors using the Astro Container API
 */
import { beforeEach, describe, expect, test } from 'vitest'
import { Window } from 'happy-dom'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
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
} from '@components/Forms/Download/client/selectors'
import DownloadFormComponent from '@components/Forms/Download/index.astro'
import {
  isButtonElement,
  isDivElement,
  isFormElement,
  isInputElement,
} from '@components/scripts/assertions/elements'

let container: AstroContainer
let domWindow: Window

function installDomGlobals(window: Window) {
  globalThis.HTMLElement = window.HTMLElement as unknown as typeof globalThis.HTMLElement
  globalThis.HTMLFormElement = window.HTMLFormElement as unknown as typeof globalThis.HTMLFormElement
  globalThis.HTMLButtonElement = window.HTMLButtonElement as unknown as typeof globalThis.HTMLButtonElement
  globalThis.HTMLInputElement = window.HTMLInputElement as unknown as typeof globalThis.HTMLInputElement
  globalThis.Element = window.Element as unknown as typeof globalThis.Element
  globalThis.Node = window.Node as unknown as typeof globalThis.Node
  globalThis.DocumentFragment = window.DocumentFragment as unknown as typeof globalThis.DocumentFragment
}

beforeEach(async () => {
  container = await AstroContainer.create()
  domWindow = new Window()
  installDomGlobals(domWindow)
})

async function renderDownloadFormDocument(): Promise<Document> {
  const result = await container.renderToString(DownloadFormComponent, {
    props: {
      title: 'Test Resource',
      fileName: 'test-file.pdf',
      fileType: 'PDF',
    },
  })
  const domParser = new domWindow.DOMParser()
  return domParser.parseFromString(result, 'text/html') as unknown as Document
}

function createDocumentWithMarkup(markup: string): Document {
  const doc = domWindow.document.implementation.createHTMLDocument()
  doc.body.innerHTML = markup
  return doc as unknown as Document
}

describe('getDownloadFormElement selector', () => {
  test('works with element in DOM', async () => {
    const doc = await renderDownloadFormDocument()
    const element = getDownloadFormElement(doc)
    expect(isFormElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadForm')
  })

  test('throws with no form in DOM', () => {
    const doc = createDocumentWithMarkup('<div></div>')
    expect(() => getDownloadFormElement(doc)).toThrow('Download form element not found')
  })

  test('throws with wrong element type', () => {
    const doc = createDocumentWithMarkup('<div id="downloadForm"></div>')
    expect(() => getDownloadFormElement(doc)).toThrow('Download form element not found')
  })

  test('scopes queries to the provided root', async () => {
    const doc = await renderDownloadFormDocument()
    const component = doc.querySelector('download-form')
    expect(component).toBeTruthy()
    if (!component) {
      throw new Error('download-form wrapper not found in DOM')
    }
    const element = getDownloadFormElement(component)
    expect(isFormElement(element)).toBeTruthy()
  })
})

describe('getDownloadSubmitButton selector', () => {
  test('works with element in DOM', async () => {
    const doc = await renderDownloadFormDocument()
    const element = getDownloadSubmitButton(doc)
    expect(isButtonElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadSubmitBtn')
  })

  test('throws with no button in DOM', () => {
    const doc = createDocumentWithMarkup('<div></div>')
    expect(() => getDownloadSubmitButton(doc)).toThrow('Download submit button not found')
  })

  test('throws with wrong element type', () => {
    const doc = createDocumentWithMarkup('<div id="downloadSubmitBtn"></div>')
    expect(() => getDownloadSubmitButton(doc)).toThrow('Download submit button not found')
  })
})

describe('getDownloadStatusDiv selector', () => {
  test('works with element in DOM', async () => {
    const doc = await renderDownloadFormDocument()
    const element = getDownloadStatusDiv(doc)
    expect(isDivElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadFormStatus')
  })

  test('throws with no status div in DOM', () => {
    const doc = createDocumentWithMarkup('<div></div>')
    expect(() => getDownloadStatusDiv(doc)).toThrow('Download status div not found')
  })
})

describe('getDownloadButtonWrapper selector', () => {
  test('works with element in DOM', async () => {
    const doc = await renderDownloadFormDocument()
    const element = getDownloadButtonWrapper(doc)
    expect(isDivElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadButtonWrapper')
  })

  test('throws with no wrapper in DOM', () => {
    const doc = createDocumentWithMarkup('<div></div>')
    expect(() => getDownloadButtonWrapper(doc)).toThrow('Download button wrapper not found')
  })
})

const inputSelectorCases = [
  {
    name: 'first name',
    selector: getDownloadFirstNameInput,
    id: 'firstName',
    errorMessage: 'First name input not found',
  },
  {
    name: 'last name',
    selector: getDownloadLastNameInput,
    id: 'lastName',
    errorMessage: 'Last name input not found',
  },
  {
    name: 'work email',
    selector: getDownloadWorkEmailInput,
    id: 'workEmail',
    errorMessage: 'Work email input not found',
  },
  {
    name: 'job title',
    selector: getDownloadJobTitleInput,
    id: 'jobTitle',
    errorMessage: 'Job title input not found',
  },
  {
    name: 'company name',
    selector: getDownloadCompanyNameInput,
    id: 'companyName',
    errorMessage: 'Company name input not found',
  },
]

describe.each(inputSelectorCases)('$name selector', ({ selector, id, errorMessage }) => {
  test('works with element in DOM', async () => {
    const doc = await renderDownloadFormDocument()
    const element = selector(doc)
    expect(isInputElement(element)).toBeTruthy()
    expect(element.id).toBe(id)
  })

  test('throws when input is missing', () => {
    const doc = createDocumentWithMarkup('<div></div>')
    expect(() => selector(doc)).toThrow(errorMessage)
  })
})
