import { describe, expect, it } from 'vitest'
import { createHighlighter } from 'shiki'

import { shikiConfigOptions, shikiTransformers } from '../shiki'

describe('shiki transformers', () => {
  it('supports meta-based error and warning line highlights', async () => {
    const highlighter = await createHighlighter({
      themes: [...shikiConfigOptions.themeRegistrations],
      langs: ['bash'],
    })

    const html = highlighter.codeToHtml(['echo ok', 'echo bad', 'echo warn'].join('\n'), {
      lang: 'bash',
      theme: shikiConfigOptions.theme,
      transformers: shikiTransformers,
      meta: { __raw: 'error={2} warning={3}' },
    })

    expect(html).toContain('line-error')
    expect(html).toContain('line-warning')
  })

  it('supports meta-based ins/del markers', async () => {
    const highlighter = await createHighlighter({
      themes: [...shikiConfigOptions.themeRegistrations],
      langs: ['bash'],
    })

    const html = highlighter.codeToHtml(['echo add', 'echo remove'].join('\n'), {
      lang: 'bash',
      theme: shikiConfigOptions.theme,
      transformers: shikiTransformers,
      meta: { __raw: 'ins={1} del={2}' },
    })

    expect(html).toContain('diff-ins')
    expect(html).toContain('diff-del')
  })

  it('supports notation-based error and warning via inline comments', async () => {
    const highlighter = await createHighlighter({
      themes: [...shikiConfigOptions.themeRegistrations],
      langs: ['typescript'],
    })

    const html = highlighter.codeToHtml(
      [
        "console.log('ok')",
        "console.error('bad') // [!code error]",
        "console.warn('warn') // [!code warning]",
      ].join('\n'),
      {
        lang: 'typescript',
        theme: shikiConfigOptions.theme,
        transformers: shikiTransformers,
      }
    )

    expect(html).toContain('line-error')
    expect(html).toContain('line-warning')
  })
})
