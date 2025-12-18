import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type CoreMock = {
  getInput: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  setFailed: ReturnType<typeof vi.fn>
}

const core: CoreMock = {
  getInput: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
}

vi.mock('@actions/core', () => core)

const executeMock = vi.fn(async () => ({ rows: [] }))
const closeMock = vi.fn()

vi.mock('@libsql/client', () => {
  return {
    createClient: vi.fn(() => ({ execute: executeMock, close: closeMock })),
  }
})

describe('keep-alive action', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env['ASTRO_DB_REMOTE_URL']
    delete process.env['ASTRO_DB_APP_TOKEN']

    core.getInput = vi.fn()
    core.info = vi.fn()
    core.setFailed = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('fails when env vars are missing', async () => {
    const { run } = await import('../src/index')

    core.getInput.mockImplementation(() => '')

    await run()

    expect(core.setFailed).toHaveBeenCalled()
    expect(executeMock).not.toHaveBeenCalled()
    expect(closeMock).not.toHaveBeenCalled()
  })

  it('executes SELECT 1 and closes client', async () => {
    const { run } = await import('../src/index')

    process.env['ASTRO_DB_REMOTE_URL'] = 'libsql://example.turso.io'
    process.env['ASTRO_DB_APP_TOKEN'] = 'token'
    core.getInput.mockImplementation(() => '')

    await run()

    expect(executeMock).toHaveBeenCalledWith('SELECT 1')
    expect(closeMock).toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('[keep-alive] OK')
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('prefers inputs over env vars', async () => {
    const { run } = await import('../src/index')

    process.env['ASTRO_DB_REMOTE_URL'] = 'libsql://env.turso.io'
    process.env['ASTRO_DB_APP_TOKEN'] = 'env_token'

    core.getInput.mockImplementation((name: string) => {
      if (name === 'astro-db-remote-url') return 'libsql://input.turso.io'
      if (name === 'astro-db-app-token') return 'input_token'
      return ''
    })

    await run()

    expect(executeMock).toHaveBeenCalledWith('SELECT 1')
    expect(closeMock).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })
})
