import { BuildError } from '@lib/errors/BuildError'
import themeConfig from '@content/themes.json'

export const getMetaThemeData = (path: string) => {
  const defaultThemeId = themeConfig.defaultTheme.id
  const defaultTheme =
    themeConfig.themes.find(theme => theme.id === defaultThemeId) || themeConfig.themes[0]

  if (!defaultTheme) {
    throw new BuildError('No themes configured in themes.json; unable to set meta theme-color.')
  }
  const slug = path.replace(/^\//, '').replace(/\/$/, '') || 'home'

  return {
    slug,
    defaultTheme,
  }
}
