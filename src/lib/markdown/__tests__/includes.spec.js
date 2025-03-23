/**
 * Integration test for markdown includes plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByRole } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`allow using markdown fragments in a markdown file using !!![file.md]!!! syntax`, () => {
  const includesHtml = `!!!include(__fixtures__/header.md)!!!\n\ncontent`
  test(`includes markdown fragments in markdown`, () => {
    document.body.innerHTML = markdownItLib.render(includesHtml)
    expect(queryByRole(document.body, 'link', { hidden: true })).toHaveTextContent(`🔗`)
    expect(document.body.querySelector(`p`)).toHaveTextContent(`content`)
  })

  test(`includes passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(includesHtml)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
