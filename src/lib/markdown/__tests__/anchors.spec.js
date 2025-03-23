/**
 * Integration test for external anchor markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByRole } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`adds anchor tags to markdown`, () => {
  test(`brackets on link text and parentheses on URL generate HTML anchor tags`, () => {
    document.body.innerHTML = markdownItLib.render(`[Link](/articles/whats-new)`)
    const anchorElement = queryByRole(document.body, 'link')
    expect(anchorElement).toBeInTheDocument()
    expect(anchorElement).toHaveAttribute(`href`, `/articles/whats-new`)
  })

  test(`brackets on link text and bracket-colon after an empty line generate HTML anchor tags`, () => {
    document.body.innerHTML = markdownItLib.render(`[Link][1]\n\n[1]: /articles/whats-new`)
    const anchorElement = queryByRole(document.body, 'link')
    expect(anchorElement).toBeInTheDocument()
    expect(anchorElement).toHaveAttribute(`href`, `/articles/whats-new`)
  })

  test(`external link adds class, rel, and target to HTML anchor tags`, () => {
    document.body.innerHTML = markdownItLib.render(`[Link](http://a.com)`)
    const anchorElement = queryByRole(document.body, 'link')
    expect(anchorElement).toBeInTheDocument()
    expect(anchorElement).toHaveClass(`external-link`, { exact: true })
    expect(anchorElement).toHaveAttribute(`rel`, `noopener noreferrer`)
    expect(anchorElement).toHaveAttribute(`target`, `_blank`)
  })

  test(`link with localhost URL is treated as internal link`, () => {
    document.body.innerHTML = markdownItLib.render(`[Link](http://localhost)`)
    const anchorElement = queryByRole(document.body, 'link')
    expect(anchorElement).toBeInTheDocument()
    expect(anchorElement).not.toHaveAttribute(`target`)
  })

  test(`internal link passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`[Link](/articles/whats-new)`)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`external link passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`[Link](http://a.com)`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
