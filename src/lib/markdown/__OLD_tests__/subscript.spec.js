/**
 * Integration test for subscript markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { getByText } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`adds subscript tags to markdown`, () => {
  test(`tildes before alphanumeric characters generates HTML <sub> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`H~2~0`)
    expect(getByText(document, /2/i).nodeName === `SUB`).toBeTruthy()
  })

  test(`footnotes block passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`H~2~0`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
