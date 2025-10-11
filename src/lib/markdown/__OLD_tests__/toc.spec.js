/**
 * Integration test for table of contents markdown-it plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryAllByRole, within } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`Table of contents generates valid HTML unordered list markup`, () => {
  const markupWithHeadings = [
    '# Heading',
    '',
    '[[toc]]',
    '',
    '## Sub heading 1',
    'Some nice text',
    '',
    '## Sub heading 2',
    'Some even nicer text',
  ].join('\n')

  test(`markdown with headings generates table of contents <ul>`, () => {
    document.body.innerHTML = markdownItLib.render(markupWithHeadings)
    const tocList = queryAllByRole(document.body, `list`)[0]
    expect(within(tocList).getByText('Heading')).toBeInTheDocument()
    expect(within(tocList).getByText('Sub heading 1')).toBeInTheDocument()
    expect(within(tocList).getByText('Sub heading 2')).toBeInTheDocument()
  })

  test(`Table of contents passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(markupWithHeadings)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
