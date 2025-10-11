/**
 * Integration test for named code blocks markdown-it plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByText } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`adds HTML for a file name block to code block`, () => {
  const codeBlock = '```js:hello.js\nconsole.log("Hello World!);```'
  test.skip(`colon and file name after language name generates HTML for a file name block`, () => {
    document.body.innerHTML = markdownItLib.render(codeBlock)
    expect(queryByText(document.body, `hello.js`)).toHaveClass(`named-fence-filename`)
  })

  test.skip(`named code blocks pass accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(codeBlock)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
