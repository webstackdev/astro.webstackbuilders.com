import { describe, expect, test } from '@jest/globals'
import { resolve } from 'path'
import loadHtmlTemplate from '../../helpers/workers/loadHtmlTemplate'

interface EleventyJson {
  content: string
  inputPath: string
  outputPath: string
  url: string
}
type loadHtmlTemplate = (templatePath: string) => Promise<EleventyJson>

const templatePath = resolve(`test/jest/__fixtures__/loadHtmlTemplate.njk`)

describe('Loads a template file', () => {
  test('loadHtmlTemplate should return an HTML string', async () => {
    await expect(loadHtmlTemplate(templatePath)).resolves.toContain(
      `<p id="test__paragraph">This is a <a id="test__anchor" href="/test">test template</a>.</p>`
    )
  })
})
