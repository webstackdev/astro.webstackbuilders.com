import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type CoreMock = {
  getInput: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warning: ReturnType<typeof vi.fn>
  setFailed: ReturnType<typeof vi.fn>
}

const core: CoreMock = {
  getInput: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  setFailed: vi.fn(),
}

vi.mock('@actions/core', () => core)

const createTempEventFile = (payload: unknown) => {
  const filePath = resolve(tmpdir(), `publish-preview-status-${Date.now()}-${Math.random().toString(16).slice(2)}.json`)
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

describe('publish-preview-status action', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env['GITHUB_EVENT_PATH']
    delete process.env['GITHUB_RUN_ID']
    delete process.env['VERIFY_RESULT']
    delete process.env['DEPLOY_RESULT']
    delete process.env['PREVIEW_URL']

    core.getInput = vi.fn()
    core.info = vi.fn()
    core.warning = vi.fn()
    core.setFailed = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('skips when head_sha is missing', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'head_branch': 'feature/thing',
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_RUN_ID'] = '999'

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      if (name === 'github-token') return 'ghs_test'
      if (options?.required) throw new Error(`Missing required input: ${name}`)
      return ''
    })

    const fetchMock = vi.fn(async () => createMockResponse({ ok: true, status: 200, json: {} }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    expect(core.warning).toHaveBeenCalledWith('Missing workflow_run.head_sha; cannot publish check run.')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('creates check run when none exists', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'head_sha': '0123456789abcdef',
        'head_branch': 'feature/thing',
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_RUN_ID'] = '999'

    const inputs: Record<string, string> = {
      'github-token': 'ghs_test',
      'verify-result': 'success',
      'deploy-result': 'success',
      'preview-url': 'https://example.vercel.app',
    }

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      const value = (inputs[name] ?? '').trim()
      if (options?.required && !value) {
        throw new Error(`Missing required input: ${name}`)
      }
      return value
    })

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/check-runs?filter=latest')) {
        return createMockResponse({ ok: true, status: 200, json: { check_runs: [] } })
      }
      if (String(url).endsWith('/check-runs') && init?.method === 'POST') {
        return createMockResponse({ ok: true, status: 201, json: { id: 1 } })
      }
      return createMockResponse({ ok: false, status: 404 })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/check-runs') && (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(createCall).toBeTruthy()

    const [, init] = createCall as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { output?: { summary?: string }, details_url?: string }

    expect(body.output?.summary).toContain('Preview deployed: https://example.vercel.app')
    expect(body.details_url).toContain('actions/runs/999')

    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('updates existing check run when present', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'head_sha': '0123456789abcdef',
        'head_branch': 'feature/thing',
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_RUN_ID'] = '999'

    const inputs: Record<string, string> = {
      'github-token': 'ghs_test',
      'verify-result': 'success',
      'deploy-result': 'failure',
      'preview-url': '',
    }

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      const value = (inputs[name] ?? '').trim()
      if (options?.required && !value) {
        throw new Error(`Missing required input: ${name}`)
      }
      return value
    })

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/check-runs?filter=latest')) {
        return createMockResponse({
          ok: true,
          status: 200,
          json: {
            check_runs: [{ id: 456, name: 'Deploy Preview to Vercel' }],
          },
        })
      }
      if (String(url).includes('/check-runs/456') && init?.method === 'PATCH') {
        return createMockResponse({ ok: true, status: 200, json: { id: 456 } })
      }
      return createMockResponse({ ok: false, status: 404 })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    const patchCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes('/check-runs/456') && (init as RequestInit | undefined)?.method === 'PATCH',
    )
    expect(patchCall).toBeTruthy()

    const [, init] = patchCall as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { conclusion?: string; output?: { summary?: string } }

    expect(body.conclusion).toBe('failure')
    expect(body.output?.summary).toContain('Preview deployment failed (failure).')

    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('marks hotfix branch as success regardless of results', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'head_sha': '0123456789abcdef',
        'head_branch': 'hotfix/something',
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_RUN_ID'] = '999'

    const inputs: Record<string, string> = {
      'github-token': 'ghs_test',
      'verify-result': 'failure',
      'deploy-result': 'failure',
      'preview-url': '',
    }

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      const value = (inputs[name] ?? '').trim()
      if (options?.required && !value) {
        throw new Error(`Missing required input: ${name}`)
      }
      return value
    })

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/check-runs?filter=latest')) {
        return createMockResponse({ ok: true, status: 200, json: { check_runs: [] } })
      }
      if (String(url).endsWith('/check-runs') && init?.method === 'POST') {
        return createMockResponse({ ok: true, status: 201, json: { id: 1 } })
      }
      return createMockResponse({ ok: false, status: 404 })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/check-runs') && (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(createCall).toBeTruthy()

    const [, init] = createCall as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { conclusion?: string; output?: { summary?: string } }

    expect(body.conclusion).toBe('success')
    expect(body.output?.summary).toContain('Hotfix branch: preview deploy intentionally skipped.')
  })
})
