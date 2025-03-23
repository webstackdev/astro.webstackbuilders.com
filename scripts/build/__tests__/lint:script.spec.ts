import { describe, expect, test } from '@jest/globals'

// eslint-disable-next-line import/no-named-as-default
import { lintScriptTask } from '../tasks/lint:script'
import { pipeFile } from '../pipe'

describe(`Lints JavaScript and TypeScript source files`, () => {
  // Getting '* can't resolve reference #/definitions/directiveConfigSchema from id #' errors
  // https://github.com/typescript-eslint/typescript-eslint/issues/5525
  // ESLint still runs, but test is timing out I think on resolving references
  test.skip(`Lints JavaScript`, async () => {
    const sut = await pipeFile(`console.log(true)`, 'public/js/test.js', lintScriptTask)
    expect(sut).toBeInstanceOf(Array)
    expect(sut).toHaveLength(1)
    expect(sut[0]).toBe(`console.log(true)`)
  })
})
