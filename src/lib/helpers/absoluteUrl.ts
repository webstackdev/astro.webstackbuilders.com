/**
 * Return a fully resolved URL based on whether the environment is production or development
 *
 * Usage:
 * <a href={absoluteUrl('/about')}">About Me</a>
 * Result:
 * <a href="https://example.com/about">About Me</a>
 *
 * @param route the page URL to build a fully qualified URL with
 * @param site the Astro.site object that can only be accessed in .astro files
 * @returns fully qualified URL
 */
import { BuildError } from '@lib/errors'

export const absoluteUrl = (route: string, site?: URL) => {
  if (!route || !(site instanceof URL)) {
    throw new BuildError({
      message: `absoluteUrl helper called but either route or site not passed`
    })
  }
  const normalizedUrl = new URL(route, site.href)
  return normalizedUrl.href
}
