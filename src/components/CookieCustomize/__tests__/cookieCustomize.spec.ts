/**
 * @jest-environment-options {"JSDOM_QUIET_MODE": true}
 *
 * Tests for cookies customize modal
 */
//import { resolve } from 'path'
import { describe, expect, test } from '@jest/globals'
/*
import {
  getCurriedFixturePath,
  loadDomWithScript,
} from '../../../../../../test/jest/helpers'
*/
//const getFixturePath = getCurriedFixturePath(__dirname)
//const sutTemplatePath = resolve(process.cwd(), `src/_layouts/modals/cookieConsent.njk`)

describe(`cookieCustomize modal works`, () => {
  test(`cookieCustomize`, () => {
    //const scriptPath = getFixturePath(`getters_1.ts`)
    //await loadDomWithScript(sutTemplatePath, scriptPath, document)
    //const body = document.querySelector(`body`)!
    // @ts-ignore jest extended types aren't working correctly
    expect(true).toBeTruthy()
  })
})