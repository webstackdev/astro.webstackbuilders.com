import { contact } from './contact/responder'
import { downloads } from './downloads/responder'
import { gdpr } from './gdpr/responder'
import { newsletter } from './newsletter/responder'
import { search } from './search/action'

export const server = {
  contact,
  downloads,
  gdpr,
  newsletter,
  search,
}
