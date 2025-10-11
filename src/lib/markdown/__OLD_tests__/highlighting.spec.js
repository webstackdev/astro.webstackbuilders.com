/**
 * Integration test for highlighting markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByText } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`add highlighting to markdown`, () => {
  test(`adds <mark> tag to marked text in markdown`, () => {
    document.body.innerHTML = markdownItLib.render(`==highlighted text==`)
    const markElement = queryByText(document, /highlighted text/i)
    expect(markElement).toBeInTheDocument()
    expect(markElement.nodeName == 'MARK').toBeTruthy()
  })

  test(`highlighting passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`==marked==`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
