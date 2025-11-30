import { titleCase } from 'title-case'
import { BuildError } from '../errors/BuildError'

/**
 * Include the page name in the tab title if it's set
 *
 * @param title The title set in frontmatter for the page
 * @param siteTitle The site title from Astro.site, only available in .astro files
 * @returns The formatted page title
 */
export const pageTitle = (title: string, siteTitle: string) => {
  if (typeof title !== 'string') {
    throw new BuildError('Title passed to pageTitle formatter is not a string')
  }
  const seperator = ` | `
  const casedPageTitle = titleCase(title)
  const casedSiteTitle = titleCase(siteTitle)
  const pageTitle = title ? `${casedPageTitle}${seperator}${casedSiteTitle}` : casedSiteTitle

  return pageTitle
}
