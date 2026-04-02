import { isProd } from '@actions/utils/environment/environmentActions'
import { ActionsFunctionError } from '@actions/utils/errors'
import { getHubspotClient } from './client'

/**
 * Permanently purges a contact from HubSpot by email address.
 * This uses the GDPR-compliant `purge` endpoint which removes
 * all data associated with the contact and cannot be undone.
 */
export async function purgeContact(email: string): Promise<void> {
  if (!isProd()) {
    console.log('[DEV/TEST MODE] HubSpot purgeContact:', { email })
    return
  }

  const client = getHubspotClient()

  try {
    await client.crm.contacts.basicApi.purge({
      objectId: email,
      idProperty: 'email',
    })
  } catch (error) {
    const message = '[HubSpot] Failed to purge contact'
    console.error(message, error)
    throw new ActionsFunctionError({
      message,
      cause: error,
      code: 'HUBSPOT_GDPR_PURGE_FAILED',
      status: 502,
      route: 'actions:hubspot',
      operation: 'purgeContact',
    })
  }
}
