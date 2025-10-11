/**
 * Integration test for markdown-it CommonMark rules, GFM tables, and GFM strikethrough
 */
const { describe, expect, test } = require('@jest/globals')
const { markdownItLib } = require(`../setup`)

describe(`embeds Youtube player from markdown`, () => {
  test(`at symbol before link with 'youtube' as name generates Youtube player embed`, () => {
    document.body.innerHTML = markdownItLib.render(`@[youtube](dQw4w9WgXcQ)`)
    expect(document.body.querySelector(`iframe`)).not.toBeNull()
  })
})
