/**
 * Type declaration for generated pages.json file
 * This file is generated during the build process
 */

type PageData =
  | string
  | { articles: string[] }
  | { 'case-studies': string[] }
  | { downloads: string[] }
  | { services: string[] }
  | { 'social-shares': string[] }
  | { stories: string[] }
  | { tags: string[] }

declare const pagesData: PageData[]
export default pagesData
