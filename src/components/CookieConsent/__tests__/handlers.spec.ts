import { resolve } from "path"
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { loadHtmlTemplate } from "@test/unit/helpers/workers"
import { getCurriedFixturePath, addScript } from "@test/unit/helpers"
import { getCookieConsentWrapper, getCookieConsentCloseBtn } from "../getters"
import { consentModalStateKey } from "@lib/state/localStorage/consentModal"

const getFixturePath = getCurriedFixturePath(__dirname)
const templatePath = resolve(process.cwd(), `src/_layouts/modals/cookieConsent.njk`)
let templateDom: string

beforeAll(async () => {
  templateDom = await loadHtmlTemplate(templatePath)
})

const setupTest = async (fixtureName: string): Promise<HTMLDivElement> => {
  document.body.innerHTML = templateDom
  localStorage.setItem(`COOKIE_MODAL_VISIBLE`, JSON.stringify({ visible: true }))
  const scriptPath = getFixturePath(fixtureName)
  const wrapper = getCookieConsentWrapper()
  wrapper.style.display = `block`
  await addScript(scriptPath, document)
  return wrapper
}

const getMockedStoreValue = () => localStorage['__STORE__'][consentModalStateKey]

describe(`handleDismissCookieModal works`, () => {
  test(`it hides modal and sets local storage value`, async () => {
    localStorage.clear()
    vi.clearAllMocks()
    const wrapper = await setupTest(`handlers_1.ts`)
    expect(wrapper.style.display).toMatch(/none/)
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
  })
})

const initCookieModalScript = `handlers_2.ts`

describe(`Close button dismisses cookie consent modal`, () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  test(`mouse click hides cookie modal and sets local storage state to hidden`, async () => {
    const user = userEvent.setup()
    const wrapper = await setupTest(initCookieModalScript)
    await user.click(getCookieConsentCloseBtn())
    expect(wrapper.style.display).toMatch(/none/)
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
  })

  test(`pressing enter key when close button has focus hides cookie modal and sets local storage state to hidden`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const button = document.querySelector(`button`)!
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(wrapper.style.display).toMatch(/none/)
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
  })

  test(`ending a touch movement hides cookie modal and sets local storage state to hidden`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const button = getCookieConsentCloseBtn()
    button.dispatchEvent(new TouchEvent('touchend'))
    expect(wrapper.style.display).toMatch(/none/)
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
  })
})

describe(`Escape key dismisses cookie consent modal when it has focus`, () => {
  test(`pressing escape key when cookie modal has focus hides the modal and sets local storage state to hidden`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    await userEvent.keyboard('{Escape}')
    expect(wrapper.style.display).toMatch(`none`)
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
  })
})

describe(`Allow all cookies link and button work`, () => {
  const cookieGrantedString = `consent_necessary=granted; consent_analytics=granted; consent_advertising=granted; consent_functional=granted`

  test(`Return keypress on allow all cookies link works`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const allowAllLink = document.querySelector(`.cookie-modal__link-allow`)!
    ;(allowAllLink as HTMLAnchorElement).focus()
    await userEvent.keyboard('{Enter}')
    // Hides cookie modal
    expect(wrapper.style.display).toMatch(`none`)
    // Sets local storage state to hidden
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
    // Sets cookie
    expect(document.cookie).toMatch(cookieGrantedString)
  })

  test(`Return keypress on allow all cookies button works`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const allowAllButton = document.querySelector(`.cookie-modal__btn-allow`)!
    ;(allowAllButton as HTMLButtonElement).focus()
    await userEvent.keyboard('{Enter}')
    // Hides cookie modal
    expect(wrapper.style.display).toMatch(`none`)
    // Sets local storage state to hidden
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
    // Sets cookie
    expect(document.cookie).toMatch(cookieGrantedString)
  })

  test(`Click on allow all cookies button works`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const allowAllButton = document.querySelector(`.cookie-modal__btn-allow`)!
    await userEvent.click(allowAllButton)
    // Hides cookie modal
    expect(wrapper.style.display).toMatch(`none`)
    // Sets local storage state to hidden
    expect(getMockedStoreValue()).toMatch(`{"visible":false}`)
    // Sets cookie
    expect(document.cookie).toMatch(cookieGrantedString)
  })
})

describe(`Customize cookies link and button work`, () => {
  const cookieCustomizingString = `consent_necessary=unknown; consent_analytics=unknown; consent_advertising=unknown; consent_functional=unknown`

  test(`Return keypress on customize cookies link works`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const customizeCookiesLink = document.querySelector(`.cookie-modal__link-customize`)!
    ;(customizeCookiesLink as HTMLAnchorElement).focus()
    await userEvent.keyboard('{Enter}')
    // Leaves cookie modal visible
    expect(wrapper.style.display).toMatch(`block`)
    // Keeps local storage state set to visible
    expect(getMockedStoreValue()).toMatch(`{"visible":true}`)
    // Sets cookie with unknown values since they're going to be customized
    expect(document.cookie).toMatch(cookieCustomizingString)
  })

  test(`Return keypress on customize cookies button works`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const customizeCookiesButton = document.querySelector(`.cookie-modal__btn-customize`)!
    ;;(customizeCookiesButton as HTMLButtonElement).focus()
    await userEvent.keyboard('{Enter}')
    // Leaves cookie modal visible
    expect(wrapper.style.display).toMatch(`block`)
    // Keeps local storage state set to visible
    expect(getMockedStoreValue()).toMatch(`{"visible":true}`)
    // Sets cookie with unknown values since they're going to be customized
    expect(document.cookie).toMatch(cookieCustomizingString)
  })

  test(`Click on customize cookies button works`, async () => {
    const wrapper = await setupTest(initCookieModalScript)
    const customizeCookiesButton = document.querySelector(`.cookie-modal__btn-customize`)!
    await userEvent.click(customizeCookiesButton)
    // Leaves cookie modal visible
    expect(wrapper.style.display).toMatch(`block`)
    // Keeps local storage state set to visible
    expect(getMockedStoreValue()).toMatch(`{"visible":true}`)
    // Sets cookie with unknown values since they're going to be customized
    expect(document.cookie).toMatch(cookieCustomizingString)
  })
})
