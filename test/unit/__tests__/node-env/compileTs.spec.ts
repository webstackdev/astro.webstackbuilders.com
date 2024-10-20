/**
 * Tests for inline Typescript compiler used to pass script to JSDOM
 */
import { resolve } from 'path'
import { describe, expect, test } from '@jest/globals'
import tsCompile from '../../helpers/workers/compileTs'
import { isString } from '../../../../src/assets/script/utils/assertions/primitives'

const getFixturePath = (fileName: string) => {
  return resolve(__dirname, '../../__fixtures__/compileTs', fileName)
}

type tsCompile = (entryFile: string) => Promise<string>

describe(`tsCompile compiles inline Typescript script`, () => {
  test(`compiles valid Typescript`, async () => {
    const fixturePath = getFixturePath(`compileTs_1.ts`)
    const sut = await tsCompile(fixturePath)
    expect(sut).toEqual(expect.stringContaining(`const foo = (input) => { return input; };`))
  })

  test(`strips typings`, async () => {
    const fixturePath = getFixturePath(`compileTs_2.ts`)
    const sut = await tsCompile(fixturePath)
    expect(sut).toEqual(expect.stringContaining(`const bar = 7;`))
  })

  test(`bundles external dependencies`, async () => {
    const fixturePath = getFixturePath(`compileTs_3.ts`)
    const sut = await tsCompile(fixturePath)
    expect(sut).toEqual(expect.stringContaining(`node_modules/lodash/lodash.js`))
    expect(isString(sut)).toBeTruthy()
    // bundling lodash dep should bloat file size, without dep should be ~300 chars
    expect(sut.length).toBeGreaterThanOrEqual(1000)
  })

  test(`imports local dependencies`, async () => {
    const fixturePath = getFixturePath(`compileTs_4.ts`)
    const sut = await tsCompile(fixturePath)
    expect(sut).toEqual(expect.stringContaining(`const myFunc = (input) => {`))
  })

  test(`throws if script file does not exist`, async () => {
    const fixturePath = getFixturePath(`nonexistent.ts`)
    await expect(tsCompile(fixturePath)).rejects.toThrow()
  })

  test(`throws if script path is a directory`, async () => {
    const fixturePath = getFixturePath(`compileTs`)
    await expect(tsCompile(fixturePath)).rejects.toThrow()
  })
})
