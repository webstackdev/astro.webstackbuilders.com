/**
 * @jest-environment-options {"JSDOM_QUIET_MODE": true}
 *
 * Tests for cookies modal getters
 */
import { resolve } from "path"
import { describe, expect, test } from "vitest"
import { getByTestId } from "@testing-library/dom"
import {
  getCurriedFixturePath,
  loadDomWithScript,
} from "@test/unit/helpers"

const getFixturePath = getCurriedFixturePath(__dirname)
const sutTemplatePath = resolve(process.cwd(), `src/_layouts/modals/cookieConsent.njk`)

describe(`getCookieConsentWrapper for elements in cookie modal work`, () => {
  test(`it returns <div> wrapper`, async () => {
    const scriptPath = getFixturePath(`getters_1.ts`)
    await loadDomWithScript(sutTemplatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(getByTestId(body, 'test-element')).toBeInTheDocument()
  })

  test(`it throws if no <div> wrapper`, async () => {
    const templatePath = getFixturePath(`getters.njk`)
    const scriptPath = getFixturePath(`getters_1.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    expect(body.innerHTML).toMatch(
      `Cookie consent modal wrapper with id 'cookie-modal-id' not found`
    )
  })
})

describe(`getCookieConsentCloseBtn for button in cookie modal works`, () => {
  test(`it returns close button`, async () => {
    const scriptPath = getFixturePath(`getters_2.ts`)
    await loadDomWithScript(sutTemplatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(getByTestId(body, 'test-element')).toBeInTheDocument()
  })

  test(`it throws if no close button in modal`, async () => {
    const templatePath = getFixturePath(`getters.njk`)
    const scriptPath = getFixturePath(`getters_2.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    expect(body.innerHTML).toMatch(
      `Cookie consent close button with class 'cookie-modal__close-btn' not found`
    )
  })
})

describe(`getCookieConsentAllowLink for elements in cookie modal work`, () => {
  test(`it returns allow link anchor`, async () => {
    const scriptPath = getFixturePath(`getters_3.ts`)
    await loadDomWithScript(sutTemplatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(getByTestId(body, 'test-element')).toBeInTheDocument()
  })

  test(`it throws if no allow link anchor`, async () => {
    const templatePath = getFixturePath(`getters.njk`)
    const scriptPath = getFixturePath(`getters_3.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    expect(body.innerHTML).toMatch(
      `Cookie consent 'Allow All' link with class 'cookie-modal__link-allow' not found`
    )
  })
})

describe(`getCookieConsentAllowBtn for allow button in cookie modal work`, () => {
  test(`it returns allow button`, async () => {
    const scriptPath = getFixturePath(`getters_4.ts`)
    await loadDomWithScript(sutTemplatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(getByTestId(body, 'test-element')).toBeInTheDocument()
  })

  test(`it throws if no allow button`, async () => {
    const templatePath = getFixturePath(`getters.njk`)
    const scriptPath = getFixturePath(`getters_4.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    expect(body.innerHTML).toMatch(
      `Cookie consent 'Allow All' button with class 'cookie-modal__btn-allow' not found`
    )
  })
})

describe(`getCookieConsentCustomizeLink for elements in cookie modal work`, () => {
  test(`it returns Customize link anchor`, async () => {
    const scriptPath = getFixturePath(`getters_5.ts`)
    await loadDomWithScript(sutTemplatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(getByTestId(body, 'test-element')).toBeInTheDocument()
  })

  test(`it throws if no customize link anchor`, async () => {
    const templatePath = getFixturePath(`getters.njk`)
    const scriptPath = getFixturePath(`getters_5.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    expect(body.innerHTML).toMatch(
      `Cookie consent 'Customize' link with class 'cookie-modal__link-customize' not found`
    )
  })
})

describe(`getCookieConsentCustomizeBtn for Customize button in cookie modal work`, () => {
  test(`it returns allow button`, async () => {
    const scriptPath = getFixturePath(`getters_6.ts`)
    await loadDomWithScript(sutTemplatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(getByTestId(body, 'test-element')).toBeInTheDocument()
  })

  test(`it throws if no customize button`, async () => {
    const templatePath = getFixturePath(`getters.njk`)
    const scriptPath = getFixturePath(`getters_6.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    const body = document.querySelector(`body`)!
    expect(body.innerHTML).toMatch(
      `Cookie consent 'Customize' button with class 'cookie-modal__btn-customize' not found`
    )
  })
})