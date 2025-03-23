/**
 * Rules to modify Markdown-It's built-in replacements typographer
 * via the replacements plugin. Adds smart quotes, arrows, etc.
 */

/**
 * @TODO: This file is a mess and needs a lot of work. Markdown-it has a built-in
 *        typographer that can be enabled globally. There are two plugins to add
 *        rules to the typographer, one with smart arrows and another with a nice
 *        array syntax for specifying rules. Plus there are unimplemented rules
 *        like fractions. Would be nice to bring all global rules from markdown-it to here.
 * https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
 */

markdownReplacements = require('markdown-it-replacements')

/**
 * Extend and modify Markdown-It's internal replacements typography functionality
 */
const markdownReplacementOptions = {
  /**
   * The markdown replacement plugin includes four rules that are also included in the base
   * Markdown-It replacements function in case the core typographer option is set to false.
   * Since `typographer` is set to true in this configuration, these are disabled for the plugin.
   */
  ellipsis: false,
  mdash: false,
  ndash: false,
  plusminus: false,
}

markdownReplacements.replacements.push({
  /** Add new replacement rule */
  name: 'allcaps',
  re: /[a-z]/g,
  sub: function (s) {
    return s.toUpperCase()
  },
  default: true,
})

// .use(require('markdown-it-replacements'), {mdash: false})

/*
// TODO:
// - fractionals 1/2, 1/4, 3/4 -> ½, ¼, ¾
// - multiplications 2 x 4 -> 2 × 4

¶ (paragraph, written as &para;)
€ (Euro, written as &#8364;)
£ (British pound, written as &pound;)
¥ (Yen, written as &yen;)
½ (one half, written as &frac12;)
¼ (one fourth, written as &frac14;)
¾ (three fourths, written as &frac34;)
° (degrees, written as &deg;)

 These rules will interfere with using HTML comments in Markdown

-->   →     &#x2192;
<--   ←     &#x2190;
<-->  ↔     &#x2194;
==>   ⇒    &#x21D2;
<==   ⇐    &#x21D0;
<==>  ⇔    &#x21D4;
*/

var ARROWS_RE = /--|==/

/**
 *
 * @param state
 */
function smartArrows(state) {
  for (var blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {
    if (state.tokens[blkIdx].type !== 'inline') {
      continue
    }

    if (ARROWS_RE.test(state.tokens[blkIdx].content)) {
      doReplacementsInToken(state.tokens[blkIdx].children)
    }
  }
}

/**
 *
 * @param inlineTokens
 */
function doReplacementsInToken(inlineTokens) {
  var i, token

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i]
    if (token.type === 'text') {
      if (ARROWS_RE.test(token.content)) {
        token.content = token.content
          // The order of these is important -- avoid premature match
          .replace(/(^|[^<])<-->([^>]|$)/gm, '$1\u2194$2')
          .replace(/(^|[^-])-->([^>]|$)/gm, '$1\u2192$2')
          .replace(/(^|[^<])<--([^-]|$)/gm, '$1\u2190$2')
          .replace(/(^|[^<])<==>([^>]|$)/gm, '$1\u21d4$2')
          .replace(/(^|[^=])==>([^>]|$)/gm, '$1\u21d2$2')
          .replace(/(^|[^<])<==([^=]|$)/gm, '$1\u21d0$2')
      }
    }
  }
}

module.exports = function replacementsWithConfig(markdownIt, scheme) {
  // Smart arrows must come before the built-in m-dash and n-dash support
  markdownIt.core.ruler.before('replacements', 'smartArrows', smartArrows)
}
/** markdownIt.core.ruler.at('replacements', function(state) {} */

/**
 * (rule.name) name for the rule
 * (rule.re) regular expression
 * (rule.sub) substitution
 * (rule.default) boolean default on/off
 */
function replacements() {
  const replacements = [
    {
      name: 'plusminus',
      re: /\+-/g,
      sub: '\u00b1',
      default: true,
    },
    {
      name: 'ellipsis',
      re: /\.\.\./g,
      sub: '\u2026',
      default: true,
    },
    {
      name: 'mdash',
      re: /(^|[^-])---([^-]|$)/gm,
      sub: '$1\u2014$2',
      default: true,
    },
    {
      name: 'ndash',
      re: /(^|[^-])--([^-]|$)/gm,
      sub: '$1\u2013$2',
      default: true,
    },
    {
      name: 'ndash',
      re: /(^|[^-\s])--([^-\s]|$)/gm,
      sub: '$1\u2013$2',
      default: true,
    },
  ]

  // guarantees order of iteration over array
  for (let replacement of replacements) {
    console.log(replacement)
  }

  module.exports.replacements = replacements
}
