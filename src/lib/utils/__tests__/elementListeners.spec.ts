/**
 * Tests for cookies modal
 */
import { beforeEach, describe, expect, test } from "vitest"
import userEvent from "@testing-library/user-event"
import { getCurriedFixturePath, addScript } from "@test/unit/helpers"

const getFixturePath = getCurriedFixturePath(__dirname)

const setupButtonTest = async (fixtureName: string): Promise<HTMLButtonElement> => {
  document.body.innerHTML = `<head></head><body><button>BUTTON</button></body>`
  const scriptPath = getFixturePath(fixtureName)
  await addScript(scriptPath, document)
  return document.querySelector(`button`)!
}

describe(`Add button listeners works`, () => {
  let button: HTMLButtonElement
  beforeEach(async () => {
    button = await setupButtonTest(`elementListeners_1.ts`)
  })

  test(`mouse click fires event handler`, async () => {
    const user = userEvent.setup()
    await user.click(button)
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })

  test(`pressing return key fires event handler when button has focus`, async () => {
    const button = document.querySelector(`button`)!
    button.focus()
    await userEvent.keyboard('{Enter}')
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })

  test(`ending a touch movement fires event handler`, () => {
    button.dispatchEvent(new TouchEvent('touchend'))
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })
})

const setupLinkTest = async (fixtureName: string): Promise<HTMLAnchorElement> => {
  document.body.innerHTML = `<head></head><body><a href="#">LINK</a></body>`
  const scriptPath = getFixturePath(fixtureName)
  await addScript(scriptPath, document)
  return document.querySelector(`a`)!
}

describe(`Add link listeners works`, () => {
  let link: HTMLAnchorElement
  beforeEach(async () => {
    link = await setupLinkTest(`elementListeners_2.ts`)
  })

  test(`mouse click fires event handler`, async () => {
    const user = userEvent.setup()
    await user.click(link)
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })

  test(`pressing return key fires event handler when anchor has focus`, async () => {
    const anchor = document.querySelector(`a`)!
    anchor.focus()
    await userEvent.keyboard('{Enter}')
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })

  test(`ending a touch movement fires event handler`, () => {
    link.dispatchEvent(new TouchEvent('touchend'))
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })
})

const setupWrapperTest = async (): Promise<HTMLDivElement> => {
  document.body.innerHTML = `<head></head><body><div tabindex="0"><button>BUTTON IN WRAPPER</button></div></body>`
  const scriptPath = getFixturePath(`elementListeners_3.ts`)
  await addScript(scriptPath, document)
  return document.querySelector(`div`)!
}

describe(`Add wrapper listeners works`, () => {
  test(`escape keypress in modal when wrapper has focus fires event handler`, async () => {
    const wrapper = await setupWrapperTest()
    wrapper.focus()
    await userEvent.keyboard('{Escape}')
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })

  test(`escape keypress in modal bubbles to fire wrapper event handler`, async () => {
    await setupWrapperTest()
    const button = document.querySelector(`button`)!
    button.focus()
    await userEvent.keyboard('{Escape}')
    expect(document.querySelector(`body`)!.innerHTML).toMatch(/SUCCESS/)
  })
})
