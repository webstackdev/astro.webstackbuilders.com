import { afterEach, describe, expect, it, vi } from 'vitest'
const loadMetaModule = async () => {
  const module = await import('../meta')
  return module.getMetaThemeData
}

const loadBuildError = async () => {
  const module = await import('@lib/errors/BuildError')
  return module.BuildError
}

describe('getMetaThemeData', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@content/themes.json')
  })

  it('returns the theme that matches the configured default id', async () => {
    vi.doMock('@content/themes.json', () => ({
      default: {
        defaultTheme: { id: 'midnight', prefersDarkScheme: true },
        themes: [
          { id: 'sunrise', colors: { backgroundOffset: '#ffeeaa' } },
          { id: 'midnight', colors: { backgroundOffset: '#001133' } },
        ],
      },
    }))

    const getMetaThemeData = await loadMetaModule()
    const theme = getMetaThemeData()

    expect(theme.id).toBe('midnight')
    expect(theme.colors?.backgroundOffset).toBe('#001133')
  })

  it('falls back to the first configured theme when the default id is missing', async () => {
    vi.doMock('@content/themes.json', () => ({
      default: {
        defaultTheme: { id: 'nonexistent', prefersDarkScheme: false },
        themes: [
          { id: 'primary', colors: { backgroundOffset: '#ffffff' } },
          { id: 'secondary', colors: { backgroundOffset: '#000000' } },
        ],
      },
    }))

    const getMetaThemeData = await loadMetaModule()
    expect(getMetaThemeData().id).toBe('primary')
  })

  it('throws a BuildError when no themes are configured', async () => {
    vi.doMock('@content/themes.json', () => ({
      default: {
        defaultTheme: { id: 'anything', prefersDarkScheme: false },
        themes: [],
      },
    }))

    const getMetaThemeData = await loadMetaModule()
    const BuildError = await loadBuildError()
    const call = () => getMetaThemeData()

    expect(call).toThrow(BuildError)
    expect(call).toThrow('No themes configured in themes.json; unable to set meta theme-color.')
  })
})
