/**
 * Integration test for markdown-it accessible lists plugin. Adds role="list" to
 * <ol> and <ul> elements to preserve accessibility when using `list-style: none`
 * or CSS that removes the bullet or number indicators of list items.
 */
const { describe, expect, test } = require('@jest/globals')
const { queryAllByRole, queryByRole } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`adds unordered list tags with role to markdown`, () => {
  test(`asterisk generates HTML unordered list tags`, () => {
    document.body.innerHTML = markdownItLib.render(`* List\n* List\n* List`)
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
    expect(listElement.nodeName === `UL`).toBeTruthy()
  })

  test(`dash generates HTML unordered list tags`, () => {
    document.body.innerHTML = markdownItLib.render(`- List\n- List\n- List`)
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
    expect(listElement.nodeName === `UL`).toBeTruthy()
  })

  test(`adds three list items`, () => {
    document.body.innerHTML = markdownItLib.render(`* List\n* List\n* List`)
    const listItems = queryAllByRole(document.body, 'listitem')
    expect(listItems).toHaveLength(3)
  })

  test(`unordered list tags have role set to list`, () => {
    document.body.innerHTML = markdownItLib.render(`* List\n* List\n* List`)
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
    expect(listElement).toHaveAttribute(`role`, `list`)
  })

  test(` passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`* List\n* List\n* List`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`adds ordered list tags with role to markdown`, () => {
  test(`numbers with a period generates HTML ordered list tags`, () => {
    document.body.innerHTML = markdownItLib.render(`1. One\n2. Two\n3. Three`)
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
    expect(listElement.nodeName === `OL`).toBeTruthy()
  })

  test(`numbers with a right parathesis generates HTML ordered list tags`, () => {
    document.body.innerHTML = markdownItLib.render(`1) One\n2) Two\n3) Three`)
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
    expect(listElement.nodeName === `OL`).toBeTruthy()
  })

  test(`ordered list tags have role set to list`, () => {
    document.body.innerHTML = markdownItLib.render(`1. One\n2. Two\n3. Three`)
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
    expect(listElement).toHaveAttribute(`role`, `list`)
  })

  test(`ordered list passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(`1. One\n2. Two\n3. Three`)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
