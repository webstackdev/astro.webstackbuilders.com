/**
 * Integration test for Apache Echarts ECharts interactive charting
 * and data visualization library for browser markdown-it plugin.
 */
const { describe, expect, test } = require('@jest/globals')
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

// https://github.com/apache/echarts
// https://echarts.apache.org/examples/en/index.html

const echartsCodeFenceTemplate = source => `
# Markdown header
Some *Markdown* text before the code fences.
\`\`\`echarts
${source}
\`\`\`
`

const categoryChartYaml = `
xAxis:
  type: category
  data:
    - Mon
    - Tue
    - Wed
    - Thu
    - Fri
    - Sat
    - Sun
yAxis:
  type: value
series:
  - data:
      - 120
      - 200
      - 150
      - 80
      - 70
      - 110
      - 130
    type: bar
    showBackground: true
    backgroundStyle:
      color: 'rgba(180, 180, 180, 0.2)'
`

describe(`Echarts generates <svg> element from markup`, () => {
  const echartsMarkdown = echartsCodeFenceTemplate(categoryChartYaml)
  test.skip(`flowchart generates proper HTML elements`, () => {
    document.body.innerHTML = markdownItLib.render(echartsMarkdown)
    expect(document.body).toMatchInlineSnapshot()
    //expect(document.body.querySelector(`math`)).toBeTruthy()
  })

  test.skip(`flowchart output passes accessibility check`, async () => {
    document.body.innerHTML = markdownItLib.render(echartsMarkdown)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
