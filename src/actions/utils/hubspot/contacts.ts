import type { SimplePublicObject } from '@hubspot/api-client/lib/codegen/crm/contacts'
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/Filter'
import { isProd } from '@actions/utils/environment/environmentActions'
import { ActionsFunctionError } from '@actions/utils/errors'
import { getHubspotClient } from './client'

export interface HubspotContactProperties {
  email: string
  firstname?: string
  lastname?: string
}

/**
 * Creates a new HubSpot contact or updates the existing one when the email
 * already exists. Returns the contact record.
 */
export async function createOrUpdateContact(
  properties: HubspotContactProperties
): Promise<SimplePublicObject> {
  if (!isProd()) {
    console.log('[DEV/TEST MODE] HubSpot createOrUpdateContact:', properties)
    const stub: SimplePublicObject = {
      id: '0',
      properties: { email: properties.email },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return stub
  }

  const client = getHubspotClient()

  // Search for an existing contact by email
  const searchResponse = await client.crm.contacts.searchApi.doSearch({
    filterGroups: [
      {
        filters: [{ propertyName: 'email', operator: FilterOperatorEnum.Eq, value: properties.email }],
      },
    ],
    properties: ['email', 'firstname', 'lastname'],
    limit: 1,
  })

  const existing = searchResponse.results[0]

  if (existing) {
    // Update the existing contact with any new properties
    const updates: Record<string, string> = {}
    if (properties.firstname) updates['firstname'] = properties.firstname
    if (properties.lastname) updates['lastname'] = properties.lastname

    if (Object.keys(updates).length > 0) {
      return await client.crm.contacts.basicApi.update(existing.id, { properties: updates })
    }
    return existing
  }

  // Create a new contact
  try {
    return await client.crm.contacts.basicApi.create({
      properties: {
        email: properties.email,
        ...(properties.firstname && { firstname: properties.firstname }),
        ...(properties.lastname && { lastname: properties.lastname }),
      },
    })
  } catch (error) {
    const message = '[HubSpot] Failed to create contact'
    console.error(message, error)
    throw new ActionsFunctionError({
      message,
      cause: error,
      code: 'HUBSPOT_CONTACT_CREATE_FAILED',
      status: 502,
      route: 'actions:hubspot',
      operation: 'createOrUpdateContact',
    })
  }
}

/**
 * Sets the hs_marketable_status property on a contact.
 * Pass `true` to opt the contact in to marketing emails.
 */
export async function setMarketingOptIn(
  contactId: string,
  optIn: boolean
): Promise<void> {
  if (!isProd()) {
    console.log('[DEV/TEST MODE] HubSpot setMarketingOptIn:', { contactId, optIn })
    return
  }

  const client = getHubspotClient()

  try {
    await client.crm.contacts.basicApi.update(contactId, {
      properties: {
        hs_marketable_status: optIn ? 'true' : 'false',
      },
    })
  } catch (error) {
    const message = '[HubSpot] Failed to set marketing opt-in'
    console.error(message, error)
    throw new ActionsFunctionError({
      message,
      cause: error,
      code: 'HUBSPOT_MARKETING_OPTIN_FAILED',
      status: 502,
      route: 'actions:hubspot',
      operation: 'setMarketingOptIn',
    })
  }
}
