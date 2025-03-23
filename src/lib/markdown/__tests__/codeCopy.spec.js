/**
 * Integration test for code copy button markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByRole } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`smoke test for code block copy button`, () => {
  const htmlString = markdownItLib.render("```javascript\nconsole.log('hello');\n```")

  test(`adds copy button to markdown code blocks`, () => {
    document.body.innerHTML = htmlString
    expect(queryByRole(document.body, `button`)).toHaveAccessibleName(`Copy`)
  })

  test(`code block with copy button passes accessibility check`, async () => {
    document.body.innerHTML = htmlString
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
