/**
 * Integration test for built-in and extended typographer substitutions like smart quotes
 */
const { describe, expect, test } = require('@jest/globals')
const { queryByText } = require(`@testing-library/dom`)
const decode = require(`html-entities-decoder`)
const { axe } = require(`../../../test/jest/accessibility`)
const { markdownItLib } = require(`../setup`)

/* eslint-disable no-irregular-whitespace */
describe(`The markdown-it parser built-in typographer replacement rules work`, () => {
  test(`(c) in markdown is replaced with ©`, async () => {
    document.body.innerHTML = markdownItLib.render(`test(c)`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&#xA9;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`(tm) in markdown is replaced with ™`, async () => {
    document.body.innerHTML = markdownItLib.render(`test(tm)`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&#x2122;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`(TM) in markdown is replaced with ™`, async () => {
    document.body.innerHTML = markdownItLib.render(`test(tm)`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&#x2122;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`(r) in markdown is replaced with ®`, async () => {
    document.body.innerHTML = markdownItLib.render(`test(r)`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&#xAE;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`(R) in markdown is replaced with ®`, async () => {
    document.body.innerHTML = markdownItLib.render(`test(R)`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&#xAE;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`+- in markdown is replaced with ±`, async () => {
    document.body.innerHTML = markdownItLib.render(`5+-`)
    expect(queryByText(document.body, /5/)).toHaveTextContent(decode(`&#xB1;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`... in markdown is replaced with …`, async () => {
    document.body.innerHTML = markdownItLib.render(`test...`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&#x2026;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`!.... in markdown is replaced with !..`, async () => {
    document.body.innerHTML = markdownItLib.render(`test!....`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(`!..`)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`?.... in markdown is replaced with ?..`, async () => {
    document.body.innerHTML = markdownItLib.render(`test?....`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(`?..`)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`???????? in markdown is replaced with ???`, async () => {
    document.body.innerHTML = markdownItLib.render(`test????????`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(`???`)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`!!!!! in markdown is replaced with !!!`, async () => {
    document.body.innerHTML = markdownItLib.render(`test!!!!!`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(`!!!`)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`,, in markdown is replaced with ,`, async () => {
    document.body.innerHTML = markdownItLib.render(`test,,`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(`,`)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`-- in markdown is replaced with –`, async () => {
    document.body.innerHTML = markdownItLib.render(`test--`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&ndash;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test(`--- in markdown is replaced with —`, async () => {
    document.body.innerHTML = markdownItLib.render(`test---`)
    expect(queryByText(document.body, /test/)).toHaveTextContent(decode(`&mdash;`))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test.skip(`should properly cope with unicode spaces`, async () => {
    /**
     * \u3000 is a unicode space character that doesn't match \s in older browsers.
     * http://www.fileformat.info/info/unicode/category/Zs/list.htm
     */
    const input = `test ==>\u3000b`
    document.body.innerHTML = markdownItLib.render(input)
    //const expected = `<p>a ⇒\u3000b</p>\n`
    expect(document.body.innerHTML).toMatchInlineSnapshot(`
      "<p>test ==&gt;　b</p>
      "
    `)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe('markdown-it smart arrows work', () => {
  test.skip('should render smart arrows', async () => {
    const input = 'test--> <-- <--> ==> <== <==>'
    document.body.innerHTML = markdownItLib.render(input)
    //const expected = '<p>→ ← ↔ ⇒ ⇐ ⇔</p>\n'
    //expect(queryByText(document.body, /test/)).toHaveTextContent(expected)
    expect(document.body.innerHTML).toMatchInlineSnapshot(`
      "<p>test–&gt; &lt;-- &lt;–&gt; <mark>&gt; &lt;</mark> &lt;==&gt;</p>
      "
    `)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  test.skip(`smart arrows rendering should not break headers or m-dashes`, async () => {
    const input = `test\n==\nAnd friends\n--\n--> <-- <-->\n\n==> <== <==> --- m-dash -- n-dash`
    document.body.innerHTML = markdownItLib.render(input)
    //const expected = `<h1>Arrows</h1>\n<h2>And friends</h2>\n<p>→ ← ↔</p>\n<p>⇒ ⇐ ⇔ — m-dash – n-dash</p>\n`
    //expect(queryByText(document.body, /test/)).toHaveTextContent(expected)
    expect(document.body.innerHTML).toMatchInlineSnapshot(`
      "<h1 id="h-test" tabindex="-1">test <a class="heading-anchor" href="#h-test" aria-hidden="true">🔗</a></h1>
      <h2 id="h-and-friends" tabindex="-1">And friends <a class="heading-anchor" href="#h-and-friends" aria-hidden="true">🔗</a></h2>
      <p>–&gt; &lt;-- &lt;–&gt;</p>
      <p><mark>&gt; &lt;</mark> &lt;==&gt; — m-dash – n-dash</p>
      "
    `)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
/* eslint-enable no-irregular-whitespace */
