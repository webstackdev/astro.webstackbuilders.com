// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { TestError } from '@test/errors'
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
import {
  isButtonElement,
  isDivElement,
  isFormElement,
  isInputElement,
} from '@components/scripts/assertions/elements'
import { renderDownloadForm } from './testUtils'

const resolveDocument = (root: Document | Element): Document => {
  if ('nodeType' in root && root.nodeType === Node.DOCUMENT_NODE) {
    return root as Document
  }
  const owner = root.ownerDocument
  if (!owner) {
    throw new TestError('Owner document not available for provided root')
  }
  return owner
}

const removeElementById = (root: Document | Element, id: string) => {
  const target = root.querySelector<HTMLElement>(`#${id}`)
  if (!target) {
    throw new TestError(`Node with id "${id}" not found for removal`)
  }
  target.remove()
}

const replaceElementWith = (
  root: Document | Element,
  id: string,
  createNode: (_doc: Document) => HTMLElement,
) => {
  const doc = resolveDocument(root)
  const original = doc.querySelector<HTMLElement>(`#${id}`)
  if (!original) {
    throw new TestError(`Node with id "${id}" not found for replacement`)
  }
  const replacement = createNode(doc)
  replacement.id = original.id
  original.replaceWith(replacement)
}

describe('getDownloadFormElement selector', () => {
  it('works with element in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      const element = getDownloadFormElement(window.document)
      expect(isFormElement(element)).toBeTruthy()
      expect(element.id).toBe('downloadForm')
    })
  })

  it('throws with no form in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      removeElementById(window.document, 'downloadForm')
      expect(() => getDownloadFormElement(window.document)).toThrow('Download form element not found')
    })
  })

  it('throws with wrong element type', async () => {
    await renderDownloadForm(async ({ window }) => {
      replaceElementWith(window.document, 'downloadForm', (doc) => doc.createElement('div'))
      expect(() => getDownloadFormElement(window.document)).toThrow('Download form element not found')
    })
  })

  it('scopes queries to the provided root', async () => {
    await renderDownloadForm(async ({ window }) => {
      const component = window.document.querySelector('download-form')
      expect(component).toBeTruthy()
      if (!component) {
        throw new TestError('download-form wrapper not found in DOM')
      }
      const element = getDownloadFormElement(component)
      expect(isFormElement(element)).toBeTruthy()
    })
  })
})

describe('getDownloadSubmitButton selector', () => {
  it('works with element in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      const element = getDownloadSubmitButton(window.document)
      expect(isButtonElement(element)).toBeTruthy()
      expect(element.id).toBe('downloadSubmitBtn')
    })
  })

  it('throws with no button in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      removeElementById(window.document, 'downloadSubmitBtn')
      expect(() => getDownloadSubmitButton(window.document)).toThrow('Download submit button not found')
    })
  })

  it('throws with wrong element type', async () => {
    await renderDownloadForm(async ({ window }) => {
      replaceElementWith(window.document, 'downloadSubmitBtn', (doc) => doc.createElement('div'))
      expect(() => getDownloadSubmitButton(window.document)).toThrow('Download submit button not found')
    })
  })
})

describe('getDownloadStatusDiv selector', () => {
  it('works with element in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      const element = getDownloadStatusDiv(window.document)
      expect(isDivElement(element)).toBeTruthy()
      expect(element.id).toBe('downloadFormStatus')
    })
  })

  it('throws with no status div in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      removeElementById(window.document, 'downloadFormStatus')
      expect(() => getDownloadStatusDiv(window.document)).toThrow('Download status div not found')
    })
  })
})

describe('getDownloadButtonWrapper selector', () => {
  it('works with element in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      const element = getDownloadButtonWrapper(window.document)
      expect(isDivElement(element)).toBeTruthy()
      expect(element.id).toBe('downloadButtonWrapper')
    })
  })

  it('throws with no wrapper in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      removeElementById(window.document, 'downloadButtonWrapper')
      expect(() => getDownloadButtonWrapper(window.document)).toThrow('Download button wrapper not found')
    })
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
  it('works with element in DOM', async () => {
    await renderDownloadForm(async ({ window }) => {
      const element = selector(window.document)
      expect(isInputElement(element)).toBeTruthy()
      expect(element.id).toBe(id)
    })
  })

  it('throws when input is missing', async () => {
    await renderDownloadForm(async ({ window }) => {
      removeElementById(window.document, id)
      expect(() => selector(window.document)).toThrow(errorMessage)
    })
  })
})
