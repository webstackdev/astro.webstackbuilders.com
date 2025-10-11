/**
 * Integration test for abbreviation markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryAllByRole, queryByRole, queryByText } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`adds footnotes to markdown`, () => {
  const footnotedText = `
Here is a footnote reference,[^1] and another.[^longnote] Here is an inline note.^[Inline notes are easier to write.]

[^1]: Here is the footnote.

[^longnote]: Here's one with multiple blocks.

    Subsequent paragraphs are indented to show that they
belong to the previous footnote.
`

  test(`adds superscript tag to footnote link in body text`, () => {
    document.body.innerHTML = markdownItLib.render(footnotedText)
    const superscriptElement = document.body.querySelector(`.footnote-ref`)
    const linkElement = queryByText(document, /\[1\]/i)
    expect(superscriptElement).not.toBeNull()
    expect(linkElement).toBeInTheDocument()
    expect(superscriptElement).toContainElement(linkElement)
  })

  test(`puts footnotes in an unordered list`, () => {
    document.body.innerHTML = markdownItLib.render(footnotedText)
    const section = queryByRole(document.body, 'region')
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
    expect(section).toContainElement(listElement)
  })

  test(`creates three footnotes`, () => {
    document.body.innerHTML = markdownItLib.render(footnotedText)
    const listItems = queryAllByRole(document.body, 'listitem')
    expect(listItems).toHaveLength(3)
  })

  test(`footnotes block passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(footnotedText)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
