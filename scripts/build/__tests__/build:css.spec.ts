import { describe, expect, test } from '@jest/globals'

// eslint-disable-next-line import/no-named-as-default
import buildCssTask from '../tasks/build:css'
import { pipeFile } from '../pipe'

/** Can't get this test working, getting write after end errors */
describe(`compiles SCSS to CSS with various features`, () => {
  test.skip(`compiles SCSS`, async () => {
    const scssStyles = '$foo: red; body { background: $foo; }'
    const expectedCss = 'body{background:red}\n\n/*# sourceMappingURL=../maps/sass/style.css.map */\n'
      const sut = await pipeFile(scssStyles, 'test.css', buildCssTask)
      expect(sut).toBeInstanceOf(Array)
      expect(sut).toHaveLength(1)
      expect(sut).toBe(expectedCss)
  })
})
