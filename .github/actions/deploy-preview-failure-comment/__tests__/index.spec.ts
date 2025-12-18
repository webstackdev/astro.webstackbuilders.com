import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
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

const tempDirs: string[] = []

const createTempEventFile = (payload: unknown) => {
  const tempDir = mkdtempSync(resolve(tmpdir(), 'preview-failure-comment-'))
  tempDirs.push(tempDir)
  const filePath = join(tempDir, 'event.json')
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

describe('preview-failure-comment action', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env['GITHUB_EVENT_PATH']
    delete process.env['GITHUB_RUN_ID']

    core.getInput = vi.fn()
    core.info = vi.fn()
    core.warning = vi.fn()
    core.setFailed = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
    vi.unstubAllGlobals()
  })

  it('builds failure comment body with correct link text', async () => {
    const { buildFailureCommentBody } = await import('../src/index')

    const a = buildFailureCommentBody({
      targetUrl: 'https://example.com',
      isFallbackRunUrl: true,
    })
    expect(a).toContain('❌ Preview deployment failed.')
    expect(a).toContain('View the workflow logs')

    const b = buildFailureCommentBody({
      targetUrl: 'https://example.vercel.app',
      isFallbackRunUrl: false,
    })
    expect(b).toContain('Open the failed Vercel deployment')
  })

  it('skips when no PR metadata exists', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'head_sha': '0123456789abcdef',
        'pull_requests': [],
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath

    const inputs: Record<string, string> = {
      'github-token': 'ghs_test',
      'preview-url': '',
    }

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      const value = (inputs[name] ?? '').trim()
      if (options?.required && !value) {
        throw new Error(`Missing required input: ${name}`)
      }
      return value
    })

    const fetchMock = vi.fn(async () => createMockResponse({ ok: true, status: 200, json: [] }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    expect(core.warning).toHaveBeenCalledWith('No pull request metadata available; skipping preview failure comment.')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('creates a PR comment using preview-url when provided', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'head_sha': '0123456789abcdef',
        'pull_requests': [{ number: 123 }],
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_RUN_ID'] = '999'

    const inputs: Record<string, string> = {
      'github-token': 'ghs_test',
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
      if (String(url).endsWith('/issues/123/comments') && init?.method === 'POST') {
        return createMockResponse({ ok: true, status: 201, json: { id: 1 } })
      }
      return createMockResponse({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    const postCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith('/issues/123/comments') && (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(postCall).toBeTruthy()

    const [, init] = postCall as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { body?: string }
    expect(body.body).toContain('Open the failed Vercel deployment')
    expect(body.body).toContain('https://example.vercel.app')

    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('falls back to GitHub run url when preview url cannot be resolved', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      'workflow_run': {
        'head_sha': '0123456789abcdef',
        'pull_requests': [{ number: 123 }],
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_RUN_ID'] = '999'

    const inputs: Record<string, string> = {
      'github-token': 'ghs_test',
      'preview-url': '',
    }

    core.getInput.mockImplementation((name: string, options?: { required?: boolean }) => {
      const value = (inputs[name] ?? '').trim()
      if (options?.required && !value) {
        throw new Error(`Missing required input: ${name}`)
      }
      return value
    })

    delete process.env['VERCEL_TOKEN']
    delete process.env['VERCEL_PROJECT_ID']
    delete process.env['VERCEL_ORG_ID']

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith('/issues/123/comments') && init?.method === 'POST') {
        return createMockResponse({ ok: true, status: 201, json: { id: 1 } })
      }
      return createMockResponse({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    const postCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith('/issues/123/comments') && (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(postCall).toBeTruthy()

    const [, init] = postCall as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { body?: string }
    expect(body.body).toContain('View the workflow logs')
    expect(body.body).toContain('actions/runs/999')

    expect(core.setFailed).not.toHaveBeenCalled()
  })
})
