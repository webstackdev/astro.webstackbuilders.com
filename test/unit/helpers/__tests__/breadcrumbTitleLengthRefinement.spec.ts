import { describe, it, expect, vi, afterEach } from 'vitest'
import { z } from 'astro:content'

const LONG_TITLE = 'A'.repeat(60)
const SHORT_TITLE = 'Short title'

const loadHelpersModule = async (isProdValue: boolean) => {
  vi.resetModules()
  vi.doMock('@lib/config/environmentServer', () => ({
    isProd: () => isProdValue,
  }))
  return import('@lib/helpers/breadcrumbTitleLengthRefinement')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('warnOnBreadcrumbTitleLength', () => {
  it('does not log warnings outside production', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { warnOnBreadcrumbTitleLength } = await loadHelpersModule(false)

    warnOnBreadcrumbTitleLength(LONG_TITLE, 'articles')

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('does not log warnings for titles within the limit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { warnOnBreadcrumbTitleLength } = await loadHelpersModule(true)

    warnOnBreadcrumbTitleLength(SHORT_TITLE, 'services')

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('logs only once per unique title and collection combo', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { warnOnBreadcrumbTitleLength } = await loadHelpersModule(true)

    warnOnBreadcrumbTitleLength(LONG_TITLE, 'services')
    warnOnBreadcrumbTitleLength(LONG_TITLE, 'services')

    expect(warnSpy).toHaveBeenCalledTimes(1)
  })
})

describe('withBreadcrumbTitleWarning', () => {
  it('wraps schemas to call the warning helper for string titles', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { withBreadcrumbTitleWarning } = await loadHelpersModule(true)

    const baseSchema = z.object({ title: z.string().optional() })
    const superRefineSpy = vi.spyOn(baseSchema, 'superRefine')

    const augmentedSchema = withBreadcrumbTitleWarning(baseSchema, 'downloads')

    expect(superRefineSpy).toHaveBeenCalledTimes(1)

    const parseResult = augmentedSchema.safeParse({ title: LONG_TITLE })
    expect(parseResult.success).toBe(true)

    expect(warnSpy).toHaveBeenCalledTimes(1)
    const [[message]] = warnSpy.mock.calls as [[string]]
    expect(message).toContain('Breadcrumb Warning')
    expect(message).toContain('downloads')
  })
})
