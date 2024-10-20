/**
 * Tests for Theme Picker HTML element selectors
 */
import { resolve } from "path"
import { beforeAll, describe, expect, test } from "vitest"
import { loadHtmlTemplate } from "@test/unit/helpers/workers"
import {
  isButtonElement,
  isDivElement,
  isSpanElement,
} from "@lib/utils/assertions/elements"
import {
  getHeader,
  getThemePickerItemCard,
} from "./testHelper"
import {
  getThemePickerToggleButton,
  getThemePickerToggleWrapper,
  getThemePickerModalWrapper,
  getThemePickerCloseButton,
  getThemePickerSelectButtons,
} from "../selectors"

const templatePath = resolve(process.cwd(), `src/_layouts/components/themePicker/themes.njk`)
let templateDom: string

beforeAll(async () => {
  templateDom = await loadHtmlTemplate(templatePath)
})

const setup = () => {
  document.body.innerHTML = templateDom
  const menu = document.querySelector(`#theme-menu`)!
  menu.innerHTML = getThemePickerItemCard()
}

describe('getThemePickerToggleWrapper selector works', () => {
  test('works against DOM', () => {
    document.body.innerHTML = getHeader()
    const sut = getThemePickerToggleWrapper()
    expect(isSpanElement(sut)).toBeTruthy()
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = `span></span>`
    expect(() => getThemePickerToggleWrapper()).toThrow()
  })
})

describe('getThemePickerToggleButton selector works', () => {
  test('works against DOM', async () => {
    const toggleTemplatePath = resolve(
      process.cwd(),
      `src/_layouts/components/themePicker/icon.njk`
    )
    document.body.innerHTML = await loadHtmlTemplate(toggleTemplatePath)
    const sut = getThemePickerToggleButton()
    expect(isButtonElement(sut)).toBeTruthy()
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = `span></span>`
    expect(() => getThemePickerToggleButton()).toThrow()
  })
})

describe('getThemePickerModalWrapper selector works', () => {
  test('works against DOM', () => {
    setup()
    const sut = getThemePickerModalWrapper()
    expect(isDivElement(sut)).toBeTruthy()
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = `span></span>`
    expect(() => getThemePickerModalWrapper()).toThrow()
  })
})

describe('getThemePickerCloseButton selector works', () => {
  test('works against DOM', () => {
    setup()
    const sut = getThemePickerCloseButton()
    expect(isButtonElement(sut)).toBeTruthy()
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = `span></span>`
    expect(() => getThemePickerCloseButton()).toThrow()
  })
})

describe('getThemePickerSelectButton selector works', () => {
  test('works against DOM', () => {
    setup()
    const sut = getThemePickerSelectButtons()
    expect(isButtonElement(sut.item(0))).toBeTruthy()
  })

  test('throws with no results selected against DOM', () => {
    document.body.innerHTML = `span></span>`
    expect(() => getThemePickerSelectButtons()).toThrow()
  })
})
