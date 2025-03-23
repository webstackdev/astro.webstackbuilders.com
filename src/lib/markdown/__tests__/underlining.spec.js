/**
 * Integration test for markdown-it CommonMark rules, GFM tables, and GFM strikethrough
 */
const { describe, expect, test } = require('@jest/globals')
const { getByText } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`leading and trailing dash adds underline to text`, () => {
  test.skip(`single asterisk generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`_underlined_`)
    expect(getByText(document, /underlined/).nodeName === `U`).toBeTruthy()
  })

  test.skip(`underline passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`_underlined_`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
