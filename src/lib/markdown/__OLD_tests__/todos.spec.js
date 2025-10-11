/**
 * Integration test for Github-style todo lists markdown plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { queryAllByRole, queryByRole, queryByLabelText } = require(`@testing-library/dom`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

describe(`GitHub style todo lists from - [ ] and - [x] markdown items`, () => {
  const todoListMarkdown = `- [ ] one\n- [X] two`
  test(`unordered list for todo list generated`, () => {
    document.body.innerHTML = markdownItLib.render(todoListMarkdown)
    const listElement = queryByRole(document.body, 'list')
    expect(listElement).toBeInTheDocument()
  })

  test(`two list items created`, () => {
    document.body.innerHTML = markdownItLib.render(todoListMarkdown)
    const listItems = queryAllByRole(document.body, 'listitem')
    expect(listItems).toHaveLength(2)
  })

  test(`first list item is not checked`, () => {
    document.body.innerHTML = markdownItLib.render(todoListMarkdown)
    const linkElement = queryByLabelText(document, /one/i)
    expect(linkElement).toBeInTheDocument()
    expect(linkElement).not.toBeChecked()
  })

  test(`second list item is checked`, () => {
    document.body.innerHTML = markdownItLib.render(todoListMarkdown)
    const linkElement = queryByLabelText(document, /two/i)
    expect(linkElement).toBeInTheDocument()
    expect(linkElement).toBeChecked()
  })

  test(`todo list passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(todoListMarkdown)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

/*
<ul class="contains-task-list">
  <li class="task-list-item">
    <input class="task-list-item-checkbox" disabled="" type="checkbox" id="task-item-3887304">
    <label class="task-list-item-label" for="task-item-3887304"> one</label>
  </li>
  <li class="task-list-item">
    <input class="task-list-item-checkbox" checked="" disabled="" type="checkbox" id="task-item-4759724"><label class="task-list-item-label" for="task-item-4759724"> two</label>
  </li>
</ul>
*/
