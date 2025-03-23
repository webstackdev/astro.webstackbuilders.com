/**
 * Shiki is a code highlighter that uses Textmate parsing and VS Code themes
 */

// @TODO: this code isn't used in production yet

/**
@TODO: would be nice to have diffing in code block like with prism
       using syntaxhighlight plugin and `diff-*` language prefix:
 
```diff-js
+function myFunction() {
   // …
-  return true;
 }
```
 */

/** Can do SVG rendering */

const fs = require('fs')
const shiki = require('shiki')
const { getSVGRenderer } = require('shiki-renderer-svg')

;(async () => {
  const highlighter = await shiki.getHighlighter({
    theme: 'github-dark',
    /*
    theme: {
      dark: 'github-dark',
      light: 'github-light'
    }
    */
  })

  const svgRenderer = await getSVGRenderer({
    bg: '#2E3440',
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
  })

  const code = fs.readFileSync('gen-svg.js', 'utf-8')

  const tokens = highlighter.codeToThemedTokens(code, 'js')
  const out = svgRenderer.renderToSVG(tokens)

  fs.writeFileSync('svg.svg', out)

  console.log('done: svg.svg')
})()
