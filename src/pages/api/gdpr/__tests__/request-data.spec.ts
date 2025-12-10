import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AstroCookies } from 'astro'
import type { DSARRequestInput } from '@pages/api/_contracts/gdpr.contracts'

const MOCK_TOKEN = 'mock-token'

const mockCheckRateLimit = vi.fn()
const mockSendEmail = vi.fn()
const mockFindActiveRequest = vi.fn()
const mockCreateDsarRequest = vi.fn()

vi.mock('uuid', () => ({
  v4: vi.fn(() => MOCK_TOKEN),
}))

vi.mock('@pages/api/_utils', () => ({
  rateLimiters: {
    export: { name: 'export' },
  },
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}))

vi.mock('@pages/api/gdpr/_dsarVerificationEmails', () => ({
  sendDSARVerificationEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

vi.mock('@pages/api/gdpr/_utils/dsarStore', () => ({
  findActiveRequestByEmail: (...args: unknown[]) => mockFindActiveRequest(...args),
  createDsarRequest: (...args: unknown[]) => mockCreateDsarRequest(...args),
}))

import { POST } from '../request-data'

const defaultRequestBody: DSARRequestInput = {
  email: 'User@Example.com',
  requestType: 'ACCESS',
}

const createRequest = (body: DSARRequestInput) =>
  new Request('http://localhost/api/gdpr/request-data', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })

const cookies = {
  get: vi.fn(() => undefined),
} as unknown as AstroCookies

type PostArgs = Parameters<typeof POST>[0]

const createContext = (overrides?: Partial<PostArgs>) => ({
  request: createRequest(defaultRequestBody),
  clientAddress: '127.0.0.1',
  cookies,
  ...overrides,
}) as PostArgs

describe('POST /api/gdpr/request-data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue({ success: true, reset: undefined })
    mockSendEmail.mockResolvedValue(undefined)
    mockFindActiveRequest.mockResolvedValue(undefined)
    mockCreateDsarRequest.mockResolvedValue(undefined)
  })

  it('reuses an existing DSAR token when one is still active', async () => {
    mockFindActiveRequest.mockResolvedValue({ token: 'existing-token' })

    const response = await POST(createContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      message: expect.stringContaining('Verification email sent'),
    })
    expect(mockFindActiveRequest).toHaveBeenCalledWith('user@example.com', 'ACCESS')
    expect(mockCreateDsarRequest).not.toHaveBeenCalled()
    expect(mockSendEmail).toHaveBeenCalledWith('user@example.com', 'existing-token', 'ACCESS')
  })

  it('creates a new DSAR request when none exist', async () => {
    mockFindActiveRequest.mockResolvedValue(undefined)

    const response = await POST(
      createContext({
        request: createRequest({
          email: 'requester@example.com',
          requestType: 'DELETE',
        }),
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload).toEqual({
      success: true,
      message: expect.stringContaining('Verification email sent'),
    })
    expect(mockCreateDsarRequest).toHaveBeenCalledWith({
      token: MOCK_TOKEN,
      email: 'requester@example.com',
      requestType: 'DELETE',
      expiresAt: expect.any(Date),
    })
    expect(mockSendEmail).toHaveBeenLastCalledWith('requester@example.com', MOCK_TOKEN, 'DELETE')
  })
})
