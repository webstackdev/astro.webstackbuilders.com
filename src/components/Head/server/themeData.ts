import themeConfig from '@content/themes.json'
import { BuildError } from '@lib/errors/BuildError'

interface ThemeInitScriptData {
  defaultThemeIdJson: string
  darkThemeIdJson: string
  metaColorsJson: string
}

type ThemeDataFunction = () => ThemeInitScriptData

export const themeData: ThemeDataFunction = () => {
  try {
    if (!Array.isArray(themeConfig.themes) || themeConfig.themes.length === 0) {
      throw new Error('themes.json must include at least one theme entry.')
    }

    const defaultThemeId = themeConfig.defaultTheme?.id
    if (!defaultThemeId) {
      throw new Error('themes.json missing defaultTheme.id value.')
    }

    const metaColors = Object.fromEntries(
      themeConfig.themes.map(theme => {
        if (!theme.id) {
          throw new Error('Theme entry missing required id.')
        }

        const color = theme.colors?.backgroundOffset
        if (!color) {
          throw new Error(`Theme ${theme.id} missing colors.backgroundOffset value.`)
        }

        return [theme.id, color]
      })
    )

    const hasDarkTheme = themeConfig.themes.some(theme => theme.id === 'dark')
    const darkThemeId = hasDarkTheme ? 'dark' : defaultThemeId

    return {
      defaultThemeIdJson: JSON.stringify(defaultThemeId),
      darkThemeIdJson: JSON.stringify(darkThemeId),
      metaColorsJson: JSON.stringify(metaColors),
    }
  } catch (error) {
    throw new BuildError('Failed to prepare theme initialization data.', {
      phase: 'compilation',
      filePath: 'src/components/Head/ThemeInit.astro',
      cause: error,
    })
  }
}
