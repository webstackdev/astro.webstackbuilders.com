import { describe, expect, it, vi } from 'vitest'

vi.mock('@actions/utils/environment/environmentActions', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
  return {
    ...actual,
    getConvertkitApiKey: () => 'ck-test-key',
    isProd: () => false,
  }
})

import { subscribeToConvertKit } from '../subscribe'

describe('newsletter subscribe entity', () => {
  it('returns a stubbed response in non-prod', async () => {
    const result = await subscribeToConvertKit({ email: 'test@example.com', firstName: 'Jane' })

    expect(result.subscriber.email_address).toBe('test@example.com')
    expect(result.subscriber.first_name).toBe('Jane')
  })

  it('throws 502 on 401 from ConvertKit in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async (importOriginal) => {
      const actual = (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getConvertkitApiKey: () => 'ck-test-key',
        isProd: () => true,
      }
    })

    const fetchSpy = vi.fn(async () => ({
      status: 401,
      json: async () => ({ errors: ['bad auth'] }),
    }))
    // @ts-expect-error - test shim
    globalThis.fetch = fetchSpy

    vi.resetModules()
    const { subscribeToConvertKit: prodSubscribeToConvertKit } = await import('../subscribe')

    await expect(prodSubscribeToConvertKit({ email: 'test@example.com' } as any)).rejects.toMatchObject({
      name: 'ActionsFunctionError',
      status: 502,
    })
  })

  it('throws 400 on 422 from ConvertKit in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async (importOriginal) => {
      const actual = (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getConvertkitApiKey: () => 'ck-test-key',
        isProd: () => true,
      }
    })

    const fetchSpy = vi.fn(async () => ({
      status: 422,
      json: async () => ({ errors: ['invalid email'] }),
    }))
    // @ts-expect-error - test shim
    globalThis.fetch = fetchSpy

    vi.resetModules()
    const { subscribeToConvertKit: prodSubscribeToConvertKit } = await import('../subscribe')

    await expect(prodSubscribeToConvertKit({ email: 'test@example.com' } as any)).rejects.toMatchObject({
      name: 'ActionsFunctionError',
      status: 400,
    })
  })

  it('returns response body on success statuses in prod', async () => {
    vi.doMock('@actions/utils/environment/environmentActions', async (importOriginal) => {
      const actual = (await importOriginal()) as typeof import('@actions/utils/environment/environmentActions')
      return {
        ...actual,
        getConvertkitApiKey: () => 'ck-test-key',
        isProd: () => true,
      }
    })

    const fetchSpy = vi.fn(async () => ({
      status: 201,
      json: async () => ({ subscriber: { id: 1, email_address: 'test@example.com' } }),
    }))
    // @ts-expect-error - test shim
    globalThis.fetch = fetchSpy

    vi.resetModules()
    const { subscribeToConvertKit: prodSubscribeToConvertKit } = await import('../subscribe')

    const result = await prodSubscribeToConvertKit({ email: 'test@example.com' } as any)
    expect(result.subscriber.id).toBe(1)
  })
})
