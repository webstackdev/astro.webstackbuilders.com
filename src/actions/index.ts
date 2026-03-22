import { contact } from './contact/action'
import { downloads } from './downloads/action'
import { gdpr } from './gdpr/action'
import { newsletter } from './newsletter/action'
import { search } from './search/action'
import { webmentions } from './webmentions/action'

export const server = {
  contact,
  downloads,
  gdpr,
  newsletter,
  search,
  webmentions,
}
