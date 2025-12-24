import { Search } from '@upstash/search'
import { getOptionalEnv } from '@lib/config/environmentServer'


const getUpstashSearchConfig = (): { url: string; token: string } => {
  const url = getOptionalEnv('PUBLIC_UPSTASH_SEARCH_REST_URL')
  const token = getOptionalEnv('PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN')

  if (!url || !token) {
    throw new Error('Search is not configured.')
  }

  return { url, token }
}

export const performSearch = async (q: string, limit = 8): Promise<SearchHit[]> => {
  const { url, token } = getUpstashSearchConfig()
  const client = new Search({ url, token })

  const response = await client.index('default').search({ query: q, limit })

  return mapUpstashSearchResults(response, q)
}
