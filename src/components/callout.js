const minify = require('html-minifier').minify
const markdownIt = require('markdown-it')()
const outdent = require('outdent')
const Icon = require('../shortcodes/icon').icon

exports.callout = (_, content, type = 'info') => {
  let icon

  switch (type) {
    case 'action':
      icon = 'check'
      break

    case 'warning':
      icon = 'warning'
      break

    case 'tip':
      icon = 'lightbulb'
      break

    case 'info':
    default:
      icon = 'info'
      break
  }

  const output = `
<div class="callout callout--${type}">
  <span class="callout__icon">${Icon(icon)}</span>
  <div class="callout__content">${markdownIt.render(content)}</div>
</div>
`

  return outdent.string(output)
}
