import { isProd, getHubspotNewsletterListId } from '@actions/utils/environment/environmentActions'
import { ActionsFunctionError } from '@actions/utils/errors'
import { getHubspotClient } from './client'

/**
 * Adds a contact (by record ID) to the HubSpot static newsletter list.
 */
export async function addContactToNewsletterList(contactId: string): Promise<void> {
  if (!isProd()) {
    console.log('[DEV/TEST MODE] HubSpot addContactToNewsletterList:', { contactId })
    return
  }

  const client = getHubspotClient()
  const listId = getHubspotNewsletterListId()

  try {
    await client.crm.lists.membershipsApi.add(listId, [contactId])
  } catch (error) {
    const message = '[HubSpot] Failed to add contact to newsletter list'
    console.error(message, error)
    throw new ActionsFunctionError({
      message,
      cause: error,
      code: 'HUBSPOT_NEWSLETTER_ADD_FAILED',
      status: 502,
      route: 'actions:hubspot',
      operation: 'addContactToNewsletterList',
    })
  }
}
