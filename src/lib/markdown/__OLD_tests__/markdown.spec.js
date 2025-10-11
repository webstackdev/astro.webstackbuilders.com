/**
 * Integration test for markdown-it CommonMark rules, GFM tables, and GFM strikethrough
 */
const { describe, expect, test } = require('@jest/globals')
const { queryAllByRole, queryByRole, getByText, within } = require(`@testing-library/dom`)
const decode = require(`html-entities-decoder`)

const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`converts double quotes to smart quotes`, () => {
  test(`single asterisk generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`"my test"`)
    const expectedContent = decode(`&#x201C;`) + `my test` + decode(`&#x201D;`)
    expect(getByText(document, /my test/i)).toHaveTextContent(expectedContent)
  })
})

describe(`converts single quotes to smart quotes`, () => {
  test(`single asterisk generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`'my test'`)
    const expectedContent = decode(`&#x2018;`) + `my test` + decode(`&#x2019;`)
    expect(getByText(document, /my test/i)).toHaveTextContent(expectedContent)
  })
})

describe(`adds italics to markdown using emphasis tags`, () => {
  test(`single asterisk generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`*Italic*`)
    expect(getByText(document, /Italic/i).nodeName === `EM`).toBeTruthy()
  })

  test(`double underlines generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`_Italic_`)
    expect(getByText(document, /Italic/i).nodeName === `EM`).toBeTruthy()
  })

  test(`italics passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`*Italic*`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`adds <strong> tags to markdown`, () => {
  test(`double asterisks generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`**Bold**`)
    expect(getByText(document, /Bold/i).nodeName === `STRONG`).toBeTruthy()
  })

  test(`double underlines generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`__Bold__`)
    expect(getByText(document, /Bold/i).nodeName === `STRONG`).toBeTruthy()
  })

  test(`strong passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`**Bold**`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`adds blockquote tags to markdown`, () => {
  test(`carat generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`> Blockquote`)
    expect(document.body.firstChild.nodeName === `BLOCKQUOTE`).toBeTruthy()
  })

  test(`blockquotes passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`> Blockquote`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`horizontal rule adds <hr> tags to markdown`, () => {
  test(`three dashes generates HTML <hr> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`Horizontal rule:\n\n---`)
    const horizontalRuleElement = queryByRole(document.body, 'separator')
    expect(horizontalRuleElement).toBeInTheDocument()
  })

  test(`three asterisks generates HTML <hr> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`Horizontal rule:\n\n***`)
    const horizontalRuleElement = queryByRole(document.body, 'separator')
    expect(horizontalRuleElement).toBeInTheDocument()
  })

  test(`horizontal rule passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`Horizontal rule:\n\n---`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`adds inline code tags to markdown`, () => {
  test(`backticks generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render('`Inline code` with backticks')
    expect(getByText(document, /Inline code/i).nodeName === `CODE`).toBeTruthy()
  })

  test(`inline code passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render('`Inline code` with backticks')
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`adds code block tags to markdown`, () => {
  const codeBlock = "```\n# code block\nprint '3 backticks or'\nprint 'indent 4 spaces'\n```"
  test(`fenced content between two sets of three backticks generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(codeBlock)
    const preElement = document.body.querySelector(`pre`)
    const codeElement = preElement.firstChild
    expect(preElement).not.toBeNull()
    expect(codeElement).not.toBeNull()
    expect(preElement.nodeName === `PRE`).toBeTruthy()
    expect(codeElement.nodeName === `CODE`).toBeTruthy()
    expect(within(codeElement).getByText(/.*code block.*/i)).toBeInTheDocument()
  })

  test(`fenced code block passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(codeBlock)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`adds table tags to markdown`, () => {
  const gfmTable = `
| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |
`
  test(`GFM table markup generates HTML for tables`, () => {
    document.body.innerHTML = markdownItLib.render(gfmTable)
    const tableItem = queryByRole(document.body, 'table')
    expect(tableItem).toBeInTheDocument()
    const tableHeaderItems = queryAllByRole(document.body, 'columnheader')
    expect(tableHeaderItems).toHaveLength(2)
    const tableRowItems = queryAllByRole(document.body, 'cell')
    expect(tableRowItems).toHaveLength(4)
  })

  test(`tables HTML passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(gfmTable)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`adds strikethrough tags to markdown`, () => {
  test(`content between two sets of double tildes generates HTML <> tags`, () => {
    document.body.innerHTML = markdownItLib.render(`~~This was mistaken text~~`)
    expect(getByText(document, /This was mistaken text/i).nodeName === `S`).toBeTruthy()
  })

  test(`strikethrough passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`~~This was mistaken text~~`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
