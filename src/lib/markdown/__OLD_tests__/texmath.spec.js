/**
 * Integration test for Texmath markdown-it plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`Texmath generates valid HTML <math> markup`, () => {
  const latexMarkup = `Euler\'s identity $e^{i\\pi}+1=0$ is a beautiful formula in $\\RR^2$.`

  test(`Texmath embedded between dollar sign delimiters generates proper HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(latexMarkup)
    expect(document.body.querySelector(`math`)).toBeTruthy()
  })

  test(`Texmath passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(latexMarkup)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
