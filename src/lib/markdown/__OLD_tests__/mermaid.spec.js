/**
 * Integration test for Mermaid JavaScript based diagramming and charting tool markdown-it plugin
 */
const { describe, expect, test } = require('@jest/globals')
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

/**
@TODO: D3 uses ES Modules, so run breaks with current Jest configuration. From CLI output:

Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

By default "node_modules" folder is ignored by transformers.

Here's what you can do:
  • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
  • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
  • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
  • If you need a custom transformation specify a "transform" option in your config.
  • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.
 */

describe(`Mermaid generates flowchart from markup`, () => {
  const markupWithMermaidFlowchart = [
    '~~~mermaid',
    'graph TD',
    '  A[Christmas] -->|Get money| B(Go shopping)',
    '  B --> C{Let me think}',
    '  C -->|One| D[Laptop]',
    '  C -->|Two| E[iPhone]',
    '  C -->|Three| F[Car]',
    '~~~',
  ].join('\n')

  test.skip(`flowchart generates proper HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidFlowchart)
    expect(document.body).toMatchInlineSnapshot()
    //expect(document.body.querySelector(`math`)).toBeTruthy()
  })

  test.skip(`flowchart output passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidFlowchart)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`Mermaid generates sequence diagram from markup`, () => {
  const markupWithMermaidSequence = [
    '~~~mermaid',
    'sequenceDiagram',
    '    participant Alice',
    '    participant Bob',
    '    Alice->>John: Hello John, how are you?',
    '    loop Healthcheck',
    '        John->>John: Fight against hypochondria',
    '    end',
    '    Note right of John: Rational thoughts <br/>prevail!',
    '    John-->>Alice: Great!',
    '    John->>Bob: How about you?',
    '    Bob-->>John: Jolly good!',
    '~~~',
  ].join('\n')

  test.skip(`sequence diagram generates proper HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidSequence)
    expect(document.body).toMatchInlineSnapshot()
    //expect(document.body.querySelector(`math`)).toBeTruthy()
  })

  test.skip(`sequence diagram output passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidSequence)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`Mermaid generates Gantt diagram from markup`, () => {
  const markupWithMermaidGantt = [
    '~~~mermaid',
    'gantt',
    'dateFormat  YYYY-MM-DD',
    'title Adding GANTT diagram to mermaid',
    'excludes weekdays 2014-01-10',
    '',
    'section A section',
    'Completed task            :done,    des1, 2014-01-06,2014-01-08',
    'Active task               :active,  des2, 2014-01-09, 3d',
    'Future task               :         des3, after des2, 5d',
    'Future task2              :         des4, after des3, 5d',
    '~~~',
  ].join('\n')

  test.skip(`Gantt diagram generates proper HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidGantt)
    expect(document.body).toMatchInlineSnapshot()
    //expect(document.body.querySelector(`math`)).toBeTruthy()
  })

  test.skip(`Gantt diagram output passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidGantt)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`Mermaid generates class diagram from markup`, () => {
  const markupWithMermaidClass = [
    '~~~mermaid',
    'classDiagram',
    'Class01 <|-- AveryLongClass : Cool',
    'Class03 *-- Class04',
    'Class05 o-- Class06',
    'Class07 .. Class08',
    'Class09 --> C2 : Where am i?',
    'Class09 --* C3',
    'Class09 --|> Class07',
    'Class07 : equals()',
    'Class07 : Object[] elementData',
    'Class01 : size()',
    'Class01 : int chimp',
    'Class01 : int gorilla',
    'Class08 <--> C2: Cool label',
    '~~~',
  ].join('\n')

  test.skip(`class diagram generates proper HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidClass)
    expect(document.body).toMatchInlineSnapshot()
    //expect(document.body.querySelector(`math`)).toBeTruthy()
  })

  test.skip(`class diagram output passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidClass)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe(`Mermaid generates Git graph from markup`, () => {
  const markupWithMermaidGitGraph = [
    '~~~mermaid',
    'gitGraph',
    '    commit',
    '    commit',
    '    branch develop',
    '    commit',
    '    commit',
    '    commit',
    '    checkout main',
    '    commit',
    '    commit',
    '~~~',
  ].join('\n')

  test.skip(`Git graph generates proper HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidGitGraph)
    expect(document.body).toMatchInlineSnapshot()
    //expect(document.body.querySelector(`math`)).toBeTruthy()
  })

  test.skip(`Git graph output passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(markupWithMermaidGitGraph)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
