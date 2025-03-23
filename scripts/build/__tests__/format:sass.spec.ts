import { describe, expect, test } from '@jest/globals'
import { pipeFile } from '../pipe'
import { formatSassTask } from '../tasks/format:sass'

// These tests all need fixed that are trying to use a testing harness for the lazypipe stack
describe(`Lint and format SCSS files`, () => {
  test(`Lints SCSS file`, async () => {
    // Unexpected missing end-of-source newline
    const scssStyles = '$foo: red; body { background: $foo; }\n'
    const sut = await pipeFile(scssStyles, 'tests.css', formatSassTask)
    expect(sut).toBeInstanceOf(Array)
    expect(sut).toHaveLength(1)
    expect(sut[0]).toBe(`$foo: red; body { background: $foo; }\n`)
  })

  test(`Fixes SCSS file with style errors`, async () => {
    // Unexpected missing end-of-source newline
    const scssStyles = '$foo: red; body { background: $foo; }'
    const sut = await pipeFile(scssStyles, 'tests.css', formatSassTask)
    expect(sut).toBeInstanceOf(Array)
    expect(sut).toHaveLength(1)
    expect(sut[0]).toBe(`$foo: red; body { background: $foo; }\n`)
  })
})
