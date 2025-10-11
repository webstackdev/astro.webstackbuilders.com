/**
 * Integration test for emoji markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { getByText } = require(`@testing-library/dom`)
const { markdownItLib } = require(`../setup`)

describe(`emoji embeds in markdown`, () => {
  /** Markdown output runs through Nunjucks after compiling */
  test(`outputs emoji using shortcode`, () => {
    document.body.innerHTML = markdownItLib.render(`:100:`)
    expect(getByText(document, /💯/i)).toBeInTheDocument()
  })

  test(`outputs emoji using shortcut`, () => {
    document.body.innerHTML = markdownItLib.render(`:)`)
    expect(getByText(document, /😃/i)).toBeInTheDocument()
  })
})
