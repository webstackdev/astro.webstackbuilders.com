import { Client } from '@hubspot/api-client'
import { getHubspotAccessToken } from '@actions/utils/environment/environmentActions'

let hubspotClient: Client | undefined

/** Returns a lazily-initialised HubSpot API client singleton. */
export function getHubspotClient(): Client {
  if (!hubspotClient) {
    hubspotClient = new Client({ accessToken: getHubspotAccessToken() })
  }
  return hubspotClient
}
