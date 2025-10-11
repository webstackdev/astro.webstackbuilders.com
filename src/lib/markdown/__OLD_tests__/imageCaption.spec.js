/**
 * Integration test for image caption markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { getByAltText, queryByRole } = require(`@testing-library/dom`)

const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`adds image tags to markdown`, () => {
  test(`brackets on image text after ! and parentheses on URL generate HTML <img> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`![Image](http://url/a.png)`)
    const imageElement = queryByRole(document.body, 'img')
    expect(imageElement).toBeInTheDocument()
    expect(imageElement).toHaveAttribute(`src`, `http://url/a.png`)
    expect(getByAltText(document.body, `Image`)).toBeInTheDocument()
  })

  test(`brackets on image text after ! and bracket-colon after an empty line generate HTML <img> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`![Image][1]\n\n[1]: http://url/b.jpg`)
    const imageElement = queryByRole(document.body, 'img')
    expect(imageElement).toBeInTheDocument()
    expect(imageElement).toHaveAttribute(`alt`, `Image`)
    expect(imageElement).toHaveAttribute(`src`, `http://url/b.jpg`)
  })

  test(`adding caption in markdown image adds caption tags to HTML output`, () => {
    document.body.innerHTML = markdownItLib.render(`![Image](http://url/a.png "My image caption")`)
    const figureElement = queryByRole(document.body, 'figure')
    expect(figureElement).toBeInTheDocument()
    const imageElement = queryByRole(document.body, 'img')
    expect(imageElement).toBeInTheDocument()
    const figcaptionElement = document.body.querySelector(`figcaption`)
    expect(figcaptionElement).not.toBeNull()
    expect(figcaptionElement).toHaveTextContent(`My image caption`)
    expect(imageElement).toHaveAccessibleName(`Image`)
  })

  test(`image passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`[Link](http://a.com)`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
