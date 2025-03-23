/**
 * @jest-environment-options {"JSDOM_QUIET_MODE": true}
 *
 * Tests for contact form getters
 */
import { resolve } from 'path'
import { describe, expect, test } from '@jest/globals'
import { getByTestId } from '@testing-library/dom'
import { getCurriedFixturePath, loadDomWithScript } from '../../../../../../test/jest/helpers'

const getFixturePath = getCurriedFixturePath(__dirname)
const sutTemplatePath = resolve(process.cwd(), `src/_layouts/layouts/pages/contact.njk`)

describe(`Submit button getter for elements in contact form work`, () => {
  test(`it returns <div> wrapper`, async () => {
    const scriptPath = getFixturePath(`selectors_1.ts`)
    await loadDomWithScript(sutTemplatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(getByTestId(body, 'test-element')).toBeInTheDocument()
  })

  test(`it throws if no <div> wrapper`, async () => {
    const templatePath = getFixturePath(`selectors.njk`)
    const scriptPath = getFixturePath(`selectors_1.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    expect(body.innerHTML).toMatch(`Contact submit button with id 'cookie-modal-id' not found`)
  })
})
