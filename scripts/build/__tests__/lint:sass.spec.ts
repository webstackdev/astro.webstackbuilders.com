import { describe, expect, test } from '@jest/globals'
import { pipeFile } from '../pipe'
import { lintSassTask } from '../tasks/lint:sass'

// These tests all need fixed that are trying to use a testing harness for the lazypipe stack
describe(`Lint SCSS files`, () => {
  test(`Lints valid SCSS file`, async () => {
    // Unexpected missing end-of-source newline
    const scssStyles = '$foo: red; body { background: $foo; }\n'
    const sut = await pipeFile(scssStyles, 'tests.css', lintSassTask)
    expect(sut).toBeInstanceOf(Array)
    expect(sut).toHaveLength(1)
    expect(sut[0]).toBe(`$foo: red; body { background: $foo; }\n`)
    //toBe(`$foo: red; body { background: $foo; }`)
  })

  // @TODO: getting "You are trying to `import` a file after the Jest environment has been torn down" error, the pipeFile is not handling a done callback so time outs
  test.skip(`Fails after linting SCSS file with style errors`, async () => {
    // Unexpected missing end-of-source newline
    const scssStyles = '$foo: red; body { background: $foo; }'
    await expect(pipeFile(scssStyles, 'tests.css', lintSassTask)).rejects.toEqual({
      error: 'User with 3 not found.',
    })
  })
})
