/**
 * Tests for loading JSDOM with script
 */
import { resolve } from 'path'
import { describe, expect, test } from '@jest/globals'
import { mockCwd } from 'mock-cwd'
import {
  addScript,
  getFixturePath as originalGetFixturePath,
  getCurriedFixturePath,
  loadDom,
  loadDomWithScript,
} from '../../helpers'

const getFixturePath = getCurriedFixturePath(resolve(__dirname, `../`))

describe(`Normalizes path`, () => {
  test(`Returns absolute path with filename and __dirname`, () => {
    mockCwd('/path/__tests__', () => {
      const templatePath = originalGetFixturePath(process.cwd(), `loadJsdom.njk`)
      expect(templatePath).toMatch(`/path/__fixtures__/loadJsdom.njk`)
    })
  })
})

describe(`Adds script to JSDOM object and runs it`, () => {
  test(`Adds script`, async () => {
    const scriptPath = getFixturePath(`loadJsdom.ts`)
    await addScript(scriptPath, document)
    expect(document.querySelectorAll(`script`)).toHaveLength(1)
    expect(document.querySelectorAll(`hr`)).toHaveLength(1)
  })
})

describe(`Destructs JSDOM object to the Document object`, () => {
  test(`Document object is valid`, async () => {
    const templatePath = getFixturePath(`loadJsdom.njk`)
    await loadDom(templatePath, document)
    expect(document.querySelectorAll(`p`)).toHaveLength(1)
  })
})

describe(`Loads JSDOM with template only`, () => {
  test(`Loads JSDOM with template only`, async () => {
    const templatePath = getFixturePath(`loadJsdom.njk`)
    await loadDom(templatePath, document)
    expect(document.querySelectorAll(`p`)).toHaveLength(1)
  })
})

describe(`Loads JSDOM with script`, () => {
  test(`Loads JSDOM with script`, async () => {
    const templatePath = getFixturePath(`loadJsdom.njk`)
    const scriptPath = getFixturePath(`loadJsdom.ts`)
    await loadDomWithScript(templatePath, scriptPath, document)
    expect(document.querySelectorAll(`hr`)).toHaveLength(1)
  })
})
