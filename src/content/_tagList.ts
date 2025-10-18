/**
 * List of tags to use for validation. These can't be an Astro Collection because
 * they're used to validate that other Astro Collections have valid tags.
 */
type ZodEnumType = [string, ...string[]]

const pageTags: ZodEnumType = [
  `articles`,
  `case-studies`,
  `contact`,
  `home`,
  `services`,
  `site`,
  `testimonials`,
]

const blogTopicTags: ZodEnumType = [`cms`, `code`, `Joomla!`, `online-learning`]

const serviceOfferingsTags: ZodEnumType = [
  `adTech`,
  `apiDesign`,
  `aws`,
  `cd`,
  `ci`,
  `cms`,
  `crm`,
  `databaseNormalization`,
  `deployment`,
  `devPortals`,
  `express`,
  `graphql`,
  `laravel`,
  `marTech`,
  `rails`,
  `react`,
  `restful`,
  `scss`,
  `sqlOptimization`,
  `typescript`,
]

export const validTags: ZodEnumType = [...blogTopicTags, ...pageTags, ...serviceOfferingsTags]

/** List of normalizations for tag names that can be used in UI */
export const exceptions = {
  apiDesign: `API Design`,
  aws: `AWS`,
  cd: `CD`,
  ci: `CI`,
  cms: `CMS`,
  crm: `CRM`,
  graphql: `GraphQl`,
  restful: `RESTful`,
  scss: `SCSS`,
  sqlOptimization: `SQL Optimization`,
  typescript: `TypeScript`,
}

// site, tagline, testimonials, articles, case-studies, services, featured,
// casestudies, sitemap, home
