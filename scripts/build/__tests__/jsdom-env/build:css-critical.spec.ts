import { describe, expect, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
import { readFileSync } from 'fs'

// eslint-disable-next-line import/no-named-as-default
import buildCssCriticalTask from '../../tasks/build:css-critical'
import { pipeFile } from '../../pipe'

// @TODO: refactor to use JSDOM instance provided by environment
describe('eleventy-critical-css', () => {
  test.skip('should inline critical CSS to the head of the document', async () => {
    const sut = await pipeFile(
      readFileSync('../__fixtures__/index.html').toString(),
      'public/js/test.js',
      buildCssCriticalTask
    )
    const { document } = new JSDOM(sut[0]).window

    const inlineStyles = document.head.querySelectorAll('style')
    expect(inlineStyles).toHaveLength(1)

    const extractedStyles = inlineStyles.item(0).innerHTML
    expect(extractedStyles).toBe('main{height:150vh}h1{color:red}')
  })
})
