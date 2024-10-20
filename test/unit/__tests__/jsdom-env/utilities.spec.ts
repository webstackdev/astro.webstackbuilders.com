/// <reference path="../../../../@types/@jest/globals/expect.d.ts" />
/**
 * @jest-environment-options {"JSDOM_QUIET_MODE": true}
 *
 * Tests for utilities and their underlying workers in a JSDOM environment
 */
import { resolve } from 'path'
import { describe, expect, test } from '@jest/globals'
import { addScript, attachScript, loadDom, loadDomWithScript } from '../../helpers'
import { loadHtmlTemplate, tsCompile } from '../../helpers/workers'

const scriptPath = resolve(`test/jest/__fixtures__/utilities.ts`)
const templatePath = resolve(`test/jest/__fixtures__/utilities.njk`)

describe(`Workers complete in worker thread in JSDOM environment`, () => {
  test(`tsCompile worker completes`, async () => {
    const sut = await tsCompile(scriptPath)
    expect(sut).toMatch(/querySelector/)
  })

  test(`loadHtmlTemplate worker completes`, async () => {
    const sut = await loadHtmlTemplate(templatePath)
    expect(sut).toMatch(/TEST/)
  })
})

describe(`Script utility helpers work`, () => {
  test(`attachScript adds script to <head>`, async () => {
    const sut = await tsCompile(scriptPath)
    attachScript(sut, document)
    const head = document.querySelector(`head`)!
    const script = head.querySelector(`script`)
    expect(script).toBeTruthy()
  })

  test(`addScript wrapper gets script and attaches it to <head>`, async () => {
    await addScript(scriptPath, document)
    const head = document.querySelector(`head`)!
    const script = head.querySelector(`script`)
    expect(script).toBeTruthy()
  })
})

describe(`Eleventy template utility helpers work`, () => {
  test(`loadDom adds template to <body>`, async () => {
    await loadDom(templatePath, document)
    const body = document.querySelector(`body`)!
    const p = body.querySelector(`p`)
    expect(p).toBeTruthy()
  })

  test(`loadDomWithScript adds script to head and template to <body>`, async () => {
    await loadDomWithScript(templatePath, scriptPath, document)
    const head = document.querySelector(`head`)!
    const script = head.querySelector(`script`)
    expect(script).toBeTruthy()

    const body = document.querySelector(`body`)!
    const p = body.querySelector(`p`)
    expect(p).toBeTruthy()
  })
})
