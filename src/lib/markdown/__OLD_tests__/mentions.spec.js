/**
 * Integration test for markdown-it Twitter like
 * mentions in markdown using @twittername syntax
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByRole } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`add Twitter mentions using @twittername syntax`, () => {
  const twitterName = `@twittername`
  test(`@ and Twitter username generates HTML mention tags`, async () => {
    document.body.innerHTML = markdownItLib.render(twitterName)
    expect(queryByRole(document.body, 'link')).toHaveTextContent(`@twittername`)
  })

  test(`Twitter mention passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(twitterName)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
