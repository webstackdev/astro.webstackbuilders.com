import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type CoreMock = {
  getInput: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  notice: ReturnType<typeof vi.fn>
  setFailed: ReturnType<typeof vi.fn>
}

const core: CoreMock = {
  getInput: vi.fn(),
  info: vi.fn(),
  notice: vi.fn(),
  setFailed: vi.fn(),
}

vi.mock('@actions/core', () => core)

const createTempEventFile = (payload: unknown) => {
  const filePath = resolve(tmpdir(), `lint-and-unit-tests-pass-${Date.now()}-${Math.random().toString(16).slice(2)}.json`)
  writeFileSync(filePath, JSON.stringify(payload), 'utf8')
  return filePath
}

const createMockResponse = (params: { ok: boolean; status: number; json?: unknown }) => {
  return {
    ok: params.ok,
    status: params.status,
    json: async () => params.json,
  }
}

describe('lint-and-unit-tests-pass action', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env['GITHUB_EVENT_PATH']

    core.getInput = vi.fn()
    core.info = vi.fn()
    core.notice = vi.fn()
    core.setFailed = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('skips verification for hotfix pull_request workflow_run', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'id': 123,
        'head_branch': 'hotfix/something',
        'event': 'pull_request',
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      if (name === 'github-token') return 'ghs_test'
      if (options?.required) throw new Error(`Missing required input: ${name}`)
      return ''
    })

    const fetchMock = vi.fn(async () => createMockResponse({ ok: true, status: 200, json: {} }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    expect(core.notice).toHaveBeenCalledWith('Hotfix branch: skipping CI verification requirements.')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('fails when required jobs are missing or not successful', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'id': 123,
        'head_branch': 'feature/thing',
        'event': 'pull_request',
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      if (name === 'github-token') return 'ghs_test'
      if (options?.required) throw new Error(`Missing required input: ${name}`)
      return ''
    })

    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/actions/runs/123/jobs')) {
        return createMockResponse({
          ok: true,
          status: 200,
          json: {
            jobs: [{ name: 'Lint', conclusion: 'success' }],
          },
        })
      }
      return createMockResponse({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('Required CI jobs missing or failed: Unit Tests')
  })

  it('passes when required jobs succeeded', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'id': 123,
        'head_branch': 'feature/thing',
        'event': 'pull_request',
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      if (name === 'github-token') return 'ghs_test'
      if (options?.required) throw new Error(`Missing required input: ${name}`)
      return ''
    })

    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/actions/runs/123/jobs')) {
        return createMockResponse({
          ok: true,
          status: 200,
          json: {
            jobs: [
              { name: 'Lint', conclusion: 'success' },
              { name: 'Unit Tests', conclusion: 'success' },
            ],
          },
        })
      }
      return createMockResponse({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('Required CI jobs succeeded.')
  })
})
