// @vitest-environment happy-dom
/**
 * Tests for DownloadForm HTML element selectors
 */
import { describe, expect, test } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import {
  isFormElement,
  isButtonElement,
  isDivElement,
} from '@components/Scripts/assertions/elements'
import {
  getDownloadFormElement,
  getDownloadSubmitButton,
  getDownloadStatusDiv,
  getDownloadButtonWrapper,
} from '../selectors'
import DownloadFormComponent from '../index.astro'

/**
 * Helper function to set up DOM from Container API
 */
async function setupDownloadFormDOM() {
  const container = await AstroContainer.create()
  const result = await container.renderToString(DownloadFormComponent, {
    props: {
      title: 'Test Resource',
      fileName: 'test-file.pdf',
      fileType: 'PDF',
    },
  })
  document.body.innerHTML = result
}

describe('getDownloadFormElement selector', () => {
  test('works with element in DOM', async () => {
    await setupDownloadFormDOM()
    const element = getDownloadFormElement()
    expect(isFormElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadForm')
  })

  test('throws with no form in DOM', () => {
    document.body.innerHTML = `<div></div>`
    expect(() => getDownloadFormElement()).toThrow('Download form element not found')
  })

  test('throws with wrong element type', () => {
    document.body.innerHTML = `<div id="downloadForm"></div>`
    expect(() => getDownloadFormElement()).toThrow('Download form element not found')
  })
})

describe('getDownloadSubmitButton selector', () => {
  test('works with element in DOM', async () => {
    await setupDownloadFormDOM()
    const element = getDownloadSubmitButton()
    expect(isButtonElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadSubmitBtn')
  })

  test('throws with no button in DOM', () => {
    document.body.innerHTML = `<div></div>`
    expect(() => getDownloadSubmitButton()).toThrow('Download submit button not found')
  })

  test('throws with wrong element type', () => {
    document.body.innerHTML = `<div id="downloadSubmitBtn"></div>`
    expect(() => getDownloadSubmitButton()).toThrow('Download submit button not found')
  })
})

describe('getDownloadStatusDiv selector', () => {
  test('works with element in DOM', async () => {
    await setupDownloadFormDOM()
    const element = getDownloadStatusDiv()
    expect(isDivElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadFormStatus')
  })

  test('throws with no status div in DOM', () => {
    document.body.innerHTML = `<div></div>`
    expect(() => getDownloadStatusDiv()).toThrow('Download status div not found')
  })
})

describe('getDownloadButtonWrapper selector', () => {
  test('works with element in DOM', async () => {
    await setupDownloadFormDOM()
    const element = getDownloadButtonWrapper()
    expect(isDivElement(element)).toBeTruthy()
    expect(element.id).toBe('downloadButtonWrapper')
  })

  test('throws with no wrapper in DOM', () => {
    document.body.innerHTML = `<div></div>`
    expect(() => getDownloadButtonWrapper()).toThrow('Download button wrapper not found')
  })
})
