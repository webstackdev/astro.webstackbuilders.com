/**
 * Tests for loading JSDOM with script
 */
import { describe, expect, test } from '@jest/globals'
import { EnvOptionDefaults, getJsdomInstance } from '../../environment/jsdomEnv'

describe(`default environmental option param are valid`, () => {
  test(`default object is valid`, () => {
    expect(EnvOptionDefaults).toEqual(
      expect.objectContaining({
        html: expect.any(String),
        userAgent: expect.any(String),
      })
    )
  })
})

describe(`getJsdomInstance returns valid JSDOM instance`, () => {
  test(`gets JSDOM environment with no options object`, () => {
    const sut = getJsdomInstance(console)
    const bodyElement = sut.window.document.querySelector(`body`)!
    bodyElement.innerHTML = `INSTANCE_1`
    expect(bodyElement.innerHTML).toMatch(/INSTANCE_1/)
  })


  test(`gets JSDOM environment with html in options object`, () => {
    const sut = getJsdomInstance(console, { html: `<!DOCTYPE html><body>TEST</body>` })
    const bodyElement = sut.window.document.querySelector(`body`)!
    expect(bodyElement.innerHTML).toMatch(/TEST/)
  })
})
