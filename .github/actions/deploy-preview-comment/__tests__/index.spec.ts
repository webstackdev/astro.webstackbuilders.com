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
  const filePath = resolve(tmpdir(), `deploy-preview-comment-${Date.now()}-${Math.random().toString(16).slice(2)}.json`)
  writeFileSync(filePath, JSON.stringify(payload), 'utf8')
  return filePath
}

const createMockResponse = (params: { ok: boolean, status: number, json?: unknown }) => {
  return {
    ok: params.ok,
    status: params.status,
    json: async () => params.json,
  }
}


describe('deploy-preview-comment action', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env['GITHUB_EVENT_PATH']
    delete process.env['GITHUB_ACTOR']

    core.getInput = vi.fn()
    core.info = vi.fn()
    core.warning = vi.fn()
    core.setFailed = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('detects vercel URLs', async () => {
    const { isVercelUrl } = await import('../src/index')
    expect(isVercelUrl('https://example.vercel.app')).toBe(true)
    expect(isVercelUrl('https://example.vercel.com')).toBe(true)
    expect(isVercelUrl('https://example.com')).toBe(false)
    expect(isVercelUrl(null)).toBe(false)
  })

  it('builds a tagged preview comment body', async () => {
    const { buildPreviewCommentBody, commentTag } = await import('../src/index')
    const body = buildPreviewCommentBody({
      branch: 'feature/my-branch',
      sha: '0123456789abcdef',
      owner: 'webstackdev',
      repo: 'astro.webstackbuilders.com',
      previewUrl: 'https://example.vercel.app',
      triggeredBy: '@someone',
    })

    expect(body).toContain(commentTag)
    expect(body).toContain('✅ **Preview deployment ready**')
    expect(body).toContain('`feature/my-branch`')
    expect(body).toContain('[0123456](')
    expect(body).toContain('https://example.vercel.app')
    expect(body).toContain('_Triggered by @someone_')
  })

  it('creates a PR comment when none exists', async () => {
    const { commentTag, run } = await import('../src/index')

    const eventPath = createTempEventFile({
      workflow_run: {
        head_branch: 'feature/my-branch',
        head_sha: '0123456789abcdef',
        actor: { login: 'kevin', html_url: 'https://github.com/kevin' },
        pull_requests: [{ number: 123 }],
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_ACTOR'] = 'fallback'

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
      if (url.includes('/issues/123/comments?')) {
        return createMockResponse({ ok: true, status: 200, json: [] })
      }
      if (url.endsWith('/issues/123/comments') && init?.method === 'POST') {
        return createMockResponse({ ok: true, status: 201, json: { id: 999 } })
      }
      return createMockResponse({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    const postCall = fetchMock.mock.calls.find(([url, init]) =>
      String(url).endsWith('/issues/123/comments') && (init as RequestInit | undefined)?.method === 'POST')
    expect(postCall).toBeTruthy()

    const [, init] = postCall as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as { body?: string }
    expect(body.body).toContain(commentTag)
    expect(body.body).toContain('https://example.vercel.app')
    expect(body.body).toContain('`feature/my-branch`')
    expect(body.body).toContain('_Triggered by [@kevin](https://github.com/kevin)_')

    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('updates an existing tagged PR comment', async () => {
    const { commentTag, run } = await import('../src/index')

    const eventPath = createTempEventFile({
      workflow_run: {
        head_branch: 'feature/my-branch',
        head_sha: '0123456789abcdef',
        actor: 'octocat',
        pull_requests: [{ number: 123 }],
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath
    process.env['GITHUB_ACTOR'] = 'fallback'

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
      if (url.includes('/issues/123/comments?')) {
        return createMockResponse({
          ok: true,
          status: 200,
          json: [{ id: 456, body: `${commentTag}\nold` }],
        })
      }
      if (url.includes('/issues/comments/456') && init?.method === 'PATCH') {
        return createMockResponse({ ok: true, status: 200, json: { id: 456 } })
      }
      return createMockResponse({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    const patchCall = fetchMock.mock.calls.find(([url, init]) =>
      String(url).includes('/issues/comments/456') && (init as RequestInit | undefined)?.method === 'PATCH')
    expect(patchCall).toBeTruthy()

    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('skips when workflow_run payload has no PR info', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      workflow_run: {
        head_branch: 'feature/my-branch',
        head_sha: '0123456789abcdef',
        pull_requests: [],
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath

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

    const fetchMock = vi.fn(async () => createMockResponse({ ok: true, status: 200, json: [] }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    expect(core.warning).toHaveBeenCalledWith(
      'Missing pull request metadata skipping preview success comment.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('fails when GitHub comment create request fails', async () => {
    const { run } = await import('../src/index')

    const eventPath = createTempEventFile({
      workflow_run: {
        head_branch: 'feature/my-branch',
        head_sha: '0123456789abcdef',
        pull_requests: [{ number: 123 }],
      },
      repository: { owner: { login: 'webstackdev' }, name: 'astro.webstackbuilders.com' },
    })

    process.env['GITHUB_EVENT_PATH'] = eventPath

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
      if (url.includes('/issues/123/comments?')) {
        return createMockResponse({ ok: true, status: 200, json: [] })
      }
      if (url.endsWith('/issues/123/comments') && init?.method === 'POST') {
        return createMockResponse({ ok: false, status: 500 })
      }
      return createMockResponse({ ok: false, status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('Unable to create PR comment (status 500).')
  })
})
