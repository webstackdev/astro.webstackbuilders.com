/**
 * Tests for event listener loader methods
 */
import { describe, expect, test } from "vitest"
import {
  getCurriedFixturePath,
  loadDomWithScript,
} from "@test/unit/helpers/utilities"

const getRelFixturePath = (filename: string) => `src/assets/script/utils/__fixtures__/${filename}`
const getFixturePath = getCurriedFixturePath(__dirname)
const templatePath = getFixturePath(`htmlDoc.njk`)

// @TODO: This test suite needs a decorator for `window.addEventListener` that can be imported
//        and that's set up in the custom jsdom environment that has mocking, so we could check
//        if the handler is called on exception/rejection

describe.skip(`Promise rejection handler event listeners work`, () => {
  test(`addUnhandledRejectionEventListeners works with rejected promise`, async () => {
    await loadDomWithScript(templatePath, getRelFixturePath(`errorListeners_1.ts`), document)
    expect(true).toBeTruthy()
  })

  test(`addUnhandledRejectionEventListeners works for promise rejected with new error`, async () => {
    await loadDomWithScript(templatePath, getRelFixturePath(`errorListeners_2.ts`), document)
    expect(true).toBeTruthy()
  })
})

describe.skip(`Error handler event listeners work`, () => {
  test(`addUnhandledExceptionEventListeners works for thrown error`, async () => {
    await loadDomWithScript(templatePath, getRelFixturePath(`errorListeners_3.ts`), document)
    expect(true).toBeTruthy()
  })
})
