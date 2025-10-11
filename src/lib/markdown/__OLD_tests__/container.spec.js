/**
 * Integration test for container markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByText } = require(`@testing-library/dom`)
const { markdownItLib } = require(`../setup`)
const { axe } = require(`../../../test/jest/accessibility`)

describe(`add block containers for warnings`, () => {
  const htmlString = markdownItLib.render(`::: warning compiles content\n:::`)

  test(`outputs fenced block with class 'container-warning'`, () => {
    document.body.innerHTML = htmlString
    expect(document.body.firstChild).toHaveClass(`container-warning`)
  })

  test(`outputs fenced block with nested <em> tag holding text`, () => {
    document.body.innerHTML = htmlString
    const emphasisElement = queryByText(document, /compiles content/i)
    expect(document.body).toContainElement(emphasisElement)
    expect(emphasisElement).toHaveTextContent(`compiles content`)
  })

  test(`embedded markup in a fenced block is rendered as HTML`, () => {
    document.body.innerHTML = markdownItLib.render(`::: warning compiles **markdown** content\n:::`)
    const compiledElement = queryByText(document, /markdown/i)
    expect(document.body).toContainElement(compiledElement)
    expect(compiledElement).toHaveTextContent(`markdown`)
    expect(compiledElement.nodeName == 'STRONG').toBeTruthy()
  })

  test(`container block passes accessibility check`, async () => {
    document.body.innerHTML = htmlString
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
