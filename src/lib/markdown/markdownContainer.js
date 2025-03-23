const md = require('markdown-it')()

exports.markdownContainerWarning = {
  /**
   * Function to validate tail after opening marker. Default is for
   * first word to indicate the type of container.
   *
   * @param {string} params Content between container fences,
   * @returns true on success
   */
  validate: function (params) {
    return params.trim().match(/^warning\s+(.*)$/)
  },
  /**
   * Renderer function for opening/closing tokens
   *
   * @param {object[]} tokens Opening and closing tokens
   * @param {number} idx Integer indicating array index of token, 0 for opening and 1 for closing
   * @returns
   */
  render: function (tokens, idx) {
    /**
     * Opening tag for container, indicated by `nesting` key of `tokens` object being set to 1
     */
    if (tokens[idx].nesting === 1) {
      /** `info` key of `token` object contains the entire params string for the container */
      const containerContent = md.render(tokens[idx].info.trim().match(/^warning\s+(.*)$/)[1])
      return '<div class="container-warning"><em>' + containerContent + '</em>\n' // md.render()
    }
    /**
     * Closing tag for container, indicated by `nesting` key of `tokens` object being set to -1
     */
    {
      return '</div>\n'
    }
  },
}
