import { beforeEach, describe, expect, it, vi } from 'vitest'

type ActionConfig<Input, Output> = {
  handler: (_input: Input, _context: unknown) => Promise<Output>
}

const getMockedHandler = <Input, Output>(action: unknown): ActionConfig<Input, Output>['handler'] => {
  return (action as ActionConfig<Input, Output>).handler
}

vi.mock('astro:actions', () => {
  return {
    defineAction: (config: unknown) => config,
  }
})

vi.mock('@actions/gdpr/entities/consent', () => {
  return {
    createConsentRecord: vi.fn(async () => ({ id: 'consent-1' })),
  }
})

vi.mock('@actions/utils/environment/environmentActions', () => {
  return {
    getPrivacyPolicyVersion: vi.fn(() => 'privacy-version-1'),
  }
})

vi.mock('@actions/utils/errors', () => {
  return {
    handleActionsFunctionError: vi.fn(() => undefined),
  }
})

vi.mock('@actions/utils/hubspot', () => {
  return {
    createOrUpdateContact: vi.fn(async () => ({ id: 'hubspot-1' })),
    setMarketingOptIn: vi.fn(async () => undefined),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('downloads inputSchema', () => {
  it('accepts omitted optional job fields', async () => {
    const { inputSchema } = await import('../action')

    const result = inputSchema.parse({
      firstName: 'Jane',
      lastName: 'Doe',
      workEmail: 'jane@example.com',
    })

    expect(result).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      workEmail: 'jane@example.com',
    })
  })

  it('normalizes blank optional job fields to undefined', async () => {
    const { inputSchema } = await import('../action')

    const result = inputSchema.parse({
      firstName: 'Jane',
      lastName: 'Doe',
      workEmail: 'jane@example.com',
      jobTitle: '   ',
      companyName: '',
    })

    expect(result).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      workEmail: 'jane@example.com',
      jobTitle: undefined,
      companyName: undefined,
    })
  })
})

describe('downloads.submit.handler', () => {
  it('submits successfully without optional job fields', async () => {
    const { downloads } = await import('../action')
    const { createOrUpdateContact } = await import('@actions/utils/hubspot')
    const { createConsentRecord } = await import('@actions/gdpr/entities/consent')

    const context = {
      request: new Request('https://example.com/_actions/downloads/submit', {
        method: 'POST',
        headers: { 'user-agent': 'ua-1' },
      }),
      clientAddress: '203.0.113.10',
    }

    const response = await getMockedHandler(downloads.submit)({
      firstName: 'Jane',
      lastName: 'Doe',
      workEmail: 'jane@example.com',
    }, context)

    expect(response).toEqual({
      success: true,
      message: 'Form submitted successfully',
    })
    expect(createOrUpdateContact).toHaveBeenCalledWith({
      email: 'jane@example.com',
      firstname: 'Jane',
      lastname: 'Doe',
    })
    expect(createConsentRecord).not.toHaveBeenCalled()
  })
})