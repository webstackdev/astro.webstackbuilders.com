import { afterEach, describe, expect, it, vi } from 'vitest'
import { TestError } from '@test/errors'
import themeConfig from '@content/themes.json'

const loadThemeData = async () => {
  const module = await import('../themeData')
  return module.themeData
}

describe('themeData', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@content/themes.json')
    vi.restoreAllMocks()
  })

  it('serializes configured theme ids and colors into JSON-safe strings', async () => {
    const themeData = await loadThemeData()
    const data = themeData()

    const defaultThemeId = JSON.parse(data.defaultThemeIdJson)
    expect(typeof defaultThemeId).toBe('string')
    expect(defaultThemeId.length).toBeGreaterThan(0)

    const darkThemeId = JSON.parse(data.darkThemeIdJson)
    expect(typeof darkThemeId).toBe('string')
    expect(darkThemeId.length).toBeGreaterThan(0)

    const colors = JSON.parse(data.metaColorsJson) as Record<string, string>
    const configuredIds = themeConfig.themes.map(theme => theme.id)

    configuredIds.forEach(id => {
      expect(colors).toHaveProperty(id)
      expect(typeof colors[id]).toBe('string')
      expect((colors[id] ?? '').length).toBeGreaterThan(0)
    })
  })

  it('throws a BuildError when the theme configuration is invalid', async () => {
    vi.doMock('@content/themes.json', () => ({
      default: {
        defaultTheme: { id: 'light', prefersDarkScheme: false },
        themes: [],
      },
    }))

    const themeData = await loadThemeData()
    expect.assertions(2)

    try {
      themeData()
    } catch (error) {
      const typedError = error as Error & { name?: string }
      expect(typedError.name).toBe('BuildError')
      expect(typedError.message).toBe('Failed to prepare theme initialization data.')
      return
    }

    throw new TestError('themeData should throw when the configuration is invalid')
  })
})
