import { describe, expect, test } from '@jest/globals'

// eslint-disable-next-line import/no-named-as-default
import formatScriptTask from '../tasks/format:script'
import { pipeFile } from '../pipe'

describe(`Formats JavaScript and TypeScript source files`, () => {
  test.skip(`Lints JavaScript`, async () => {
    const sut = await pipeFile(`console.log(true)`, 'public/js/test.js', formatScriptTask)
    expect(sut[0]).toBe(`console.log(true)`)
  })
})
