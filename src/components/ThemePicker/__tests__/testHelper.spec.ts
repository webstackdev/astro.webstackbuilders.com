import { describe, expect, test } from "vitest"
import { getThemePickerItemCard } from "./testHelper"
import { SELECTORS } from "../selectors"

/**
 * These are tests for the theme picker item card test helper to make sure it
 * stays in sync with the SELECTORS enum.
 */
describe('SELECTORS are in sync with theme picker item card fixture', () => {
  test('getThemePickerItemCard fixture works', () => {
    expect(getThemePickerItemCard()).toEqual(expect.any(String))
  })

  test('selectors match', () => {
    expect(SELECTORS.pickerModal).toMatch(`.themepicker`)
    expect(SELECTORS.themeSelectBtns).toMatch(`.themepicker__selectBtn`)
    expect(SELECTORS.closeBtn).toMatch(`.themepicker__closeBtn`)
    expect(SELECTORS.toggleBtn).toMatch(`.themepicker-toggle__toggle-btn`)
  })
})
