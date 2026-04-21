import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@actions/utils/environment/environmentActions', async importOriginal => {
  const actual =
    (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
  return {
    ...actual,
    getHubspotAccessToken: () => 'hs-test-token',
    getHubspotNewsletterListId: () => 'list-123',
    isProd: () => false,
  }
})

vi.mock('@hubspot/api-client', () => {
  const mockCreate = vi.fn()
  const mockUpdate = vi.fn()
  const mockPurge = vi.fn()
  const mockDoSearch = vi.fn()
  const mockAdd = vi.fn()

  return {
    Client: class Client {
      crm = {
        contacts: {
          basicApi: { create: mockCreate, update: mockUpdate, purge: mockPurge },
          searchApi: { doSearch: mockDoSearch },
        },
        lists: {
          membershipsApi: { add: mockAdd },
        },
      }

      constructor(_opts: unknown) {}
    },
    __mocks: { mockCreate, mockUpdate, mockPurge, mockDoSearch, mockAdd },
  }
})

import { createOrUpdateContact, setMarketingOptIn } from '../contacts'
import { addContactToNewsletterList } from '../newsletter'
import { purgeContact } from '../gdpr'

describe('hubspot contacts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a stubbed response in non-prod for createOrUpdateContact', async () => {
    const result = await createOrUpdateContact({ email: 'test@example.com', firstname: 'Jane' })

    expect(result.properties['email']).toBe('test@example.com')
    expect(result.id).toBe('0')
  })

  it('logs and returns in non-prod for setMarketingOptIn', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await setMarketingOptIn('0', true)

    expect(logSpy).toHaveBeenCalledWith('[DEV/TEST MODE] HubSpot setMarketingOptIn:', {
      contactId: '0',
      optIn: true,
    })
  })

  it('creates a new contact when search returns no results in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async importOriginal => {
      const actual =
        (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getHubspotAccessToken: () => 'hs-test-token',
        isProd: () => true,
      }
    })

    const createdContact = {
      id: '42',
      properties: { email: 'new@example.com', firstname: 'Jane' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // @ts-expect-error - accessing test mock exports
    const { __mocks } = await import('@hubspot/api-client')
    const mocks = __mocks as {
      mockCreate: ReturnType<typeof vi.fn>
      mockDoSearch: ReturnType<typeof vi.fn>
    }
    mocks.mockDoSearch.mockResolvedValueOnce({ results: [] })
    mocks.mockCreate.mockResolvedValueOnce(createdContact)

    vi.resetModules()
    const { createOrUpdateContact: prodCreate } = await import('../contacts')

    const result = await prodCreate({ email: 'new@example.com', firstname: 'Jane' })
    expect(result.id).toBe('42')
    expect(mocks.mockCreate).toHaveBeenCalled()
  })

  it('updates an existing contact when search returns a result in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async importOriginal => {
      const actual =
        (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getHubspotAccessToken: () => 'hs-test-token',
        isProd: () => true,
      }
    })

    const existingContact = {
      id: '99',
      properties: { email: 'existing@example.com', firstname: 'Old' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedContact = {
      ...existingContact,
      properties: { ...existingContact.properties, firstname: 'New' },
    }

    // @ts-expect-error - accessing test mock exports
    const { __mocks } = await import('@hubspot/api-client')
    const mocks = __mocks as {
      mockUpdate: ReturnType<typeof vi.fn>
      mockDoSearch: ReturnType<typeof vi.fn>
    }
    mocks.mockDoSearch.mockResolvedValueOnce({ results: [existingContact] })
    mocks.mockUpdate.mockResolvedValueOnce(updatedContact)

    vi.resetModules()
    const { createOrUpdateContact: prodCreate } = await import('../contacts')

    const result = await prodCreate({ email: 'existing@example.com', firstname: 'New' })
    expect(result.properties['firstname']).toBe('New')
    expect(mocks.mockUpdate).toHaveBeenCalledWith('99', { properties: { firstname: 'New' } })
  })
})

describe('hubspot newsletter', () => {
  it('logs and returns in non-prod for addContactToNewsletterList', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await addContactToNewsletterList('42')

    expect(logSpy).toHaveBeenCalledWith('[DEV/TEST MODE] HubSpot addContactToNewsletterList:', {
      contactId: '42',
    })
  })

  it('calls membershipsApi.add in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async importOriginal => {
      const actual =
        (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getHubspotAccessToken: () => 'hs-test-token',
        getHubspotNewsletterListId: () => 'list-123',
        isProd: () => true,
      }
    })

    // @ts-expect-error - accessing test mock exports
    const { __mocks } = await import('@hubspot/api-client')
    const mocks = __mocks as { mockAdd: ReturnType<typeof vi.fn> }
    mocks.mockAdd.mockResolvedValueOnce(undefined)

    vi.resetModules()
    const { addContactToNewsletterList: prodAdd } = await import('../newsletter')

    await prodAdd('42')
    expect(mocks.mockAdd).toHaveBeenCalledWith('list-123', ['42'])
  })
})

describe('hubspot gdpr', () => {
  it('logs and returns in non-prod for purgeContact', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await purgeContact('test@example.com')

    expect(logSpy).toHaveBeenCalledWith('[DEV/TEST MODE] HubSpot purgeContact:', {
      email: 'test@example.com',
    })
  })

  it('calls basicApi.purge in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async importOriginal => {
      const actual =
        (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getHubspotAccessToken: () => 'hs-test-token',
        isProd: () => true,
      }
    })

    // @ts-expect-error - accessing test mock exports
    const { __mocks } = await import('@hubspot/api-client')
    const mocks = __mocks as { mockPurge: ReturnType<typeof vi.fn> }
    mocks.mockPurge.mockResolvedValueOnce(undefined)

    vi.resetModules()
    const { purgeContact: prodPurge } = await import('../gdpr')

    await prodPurge('test@example.com')
    expect(mocks.mockPurge).toHaveBeenCalledWith({
      objectId: 'test@example.com',
      idProperty: 'email',
    })
  })
})
