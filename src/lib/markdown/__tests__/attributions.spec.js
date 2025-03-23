/**
 * Integration test for attributions markdown-it plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByRole } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`converts double quotes to smart quotes`, () => {
  const blockquote = [
    "> That's one small step for [a] man, one giant leap for mankind.",
    '> -- Neil Armstrong (1969, July 21)',
  ].join('\n')

  test(`attribution generates <figure>, <blockquote>, and <figcaption> HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(blockquote)
    const figureElement = queryByRole(document.body, `figure`)
    expect(figureElement).toBeInTheDocument()
    const blockquoteElement = figureElement.querySelector(`blockquote`)
    expect(blockquoteElement).not.toBeNull()
    const figcaptionElement = figureElement.querySelector(`figcaption`)
    expect(figcaptionElement).not.toBeNull()
  })

  test(`blockquote HTML element has correct text`, () => {
    document.body.innerHTML = markdownItLib.render(blockquote)
    const figureElement = queryByRole(document.body, `figure`)
    expect(figureElement).toBeInTheDocument()
    expect(figureElement.querySelector(`p`)).toHaveTextContent(/one small step/)
  })

  test(`figcaption HTML element has correct text`, () => {
    document.body.innerHTML = markdownItLib.render(blockquote)
    const figcaptionElement = document.body.querySelector(`figcaption`)
    expect(figcaptionElement).not.toBeNull()
    expect(figcaptionElement).toHaveTextContent(/Neil Armstrong/)
  })

  test(`attributions passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(blockquote)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
