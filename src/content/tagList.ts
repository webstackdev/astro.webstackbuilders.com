/**
 * List of tags to use for validation
 */
type ZodEnumType = [string, ...string[]]

const pageTags: ZodEnumType = [
  `articles`,
  `case-studies`,
  `contact`,
  `home`,
  `services`,
  `site`,
  `testimonials`
]

const blogTopicTags: ZodEnumType = [
  `cms`,
  `code`,
  `Joomla!`,
  `online-learning`,
]

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

export const validTags: ZodEnumType = [
  ...blogTopicTags,
  ...pageTags,
  ...serviceOfferingsTags,
]

/** Allow normalizing non-camelCased tag names */
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
