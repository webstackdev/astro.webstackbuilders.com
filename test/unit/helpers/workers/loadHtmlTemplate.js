/// <reference path="../../../../@types/@11ty/eleventy.d.ts" />
/**
 * This file is called from within a worker thread when the Eleventy task is executed
 */
const { statSync } = require('fs')
const Eleventy = require('@11ty/eleventy')

/**
 * Convenience method to load an individual HTML template using Eleventy, respecting
 * the data cascade and includes.
 *
 * @param {string} templatePath - Absolute path to the Eleventy template fixture
 * @returns {string} - the string content of the template
 * @throws {Error} - throws Error if file doesn't exist
 */
const loadHtmlTemplate = async (templatePath) => {
  statSync(templatePath)
  const templateOutput = new Eleventy(templatePath, '/tmp', { quietMode: true })
  return templateOutput.toJSON()
    .then((jsonArray) => {
      if (!jsonArray || jsonArray.length === 0 || jsonArray[0] === undefined) {
        throw new Error(`Eleventy had no output for template file ${templatePath}`)
      }
      return Promise.resolve(jsonArray[0]['content'])
    })
}

module.exports = loadHtmlTemplate
