import { describe, expect, test } from '@jest/globals'
import { loadHtmlTemplate, tsCompile } from '../../helpers'
import { resolve } from 'path'

const getFixturePath = (fileName: string) => {
  return resolve(__dirname, '../../__fixtures__/compileTs', fileName)
}

describe(`tsCompile compiles inline Typescript script`, () => {
  test(`compiles valid Typescript`, async () => {
    const fixturePath = getFixturePath(`compileTs_1.ts`)
    //expect(sut).toEqual(expect.stringContaining(`const foo = (input) => { return input; };`))
    expect(await tsCompile(fixturePath)).toMatchInlineSnapshot(`
      "/******/ (function() { // webpackBootstrap
      /******/ 	"use strict";
      var __webpack_exports__ = {};
      /*!*********************************************************!*\\
        !*** ./test/jest/__fixtures__/compileTs/compileTs_1.ts ***!
        \\*********************************************************/

      const foo = (input) => { return input; };
      foo(\`test\`);

      /******/ })()
      ;"
    `)
  })
})

describe('loadHtmlTemplate', () => {
  const templatePath = resolve(`test/jest/__fixtures__/loadHtmlTemplate.njk`)
  test('test', async () => {
    expect(await loadHtmlTemplate(templatePath)).toMatchSnapshot()
  })
})
