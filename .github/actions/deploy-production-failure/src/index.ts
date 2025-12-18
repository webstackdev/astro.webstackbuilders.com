import { getInput, info, setFailed, warning } from '@actions/core'
import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'

type WorkflowRunPayload = {
  workflow_run?: {
    head_sha?: string
  }
  repository?: {
    owner?: {
      login?: string
    }
    name?: string
  }
}

const getRequiredEnv = (name: string): string => {
  const value = (process.env[name] ?? '').trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const getJsonFromFile = <T>(filePath: string): T => {
  const raw = readFileSync(filePath, 'utf8')
  return JSON.parse(raw) as T
}

const createGitHubRequestHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'webstackbuilders-deploy-production-failure-action',
})

const githubApiBaseUrl = (() => {
  const raw = (process.env['GITHUB_API_URL'] ?? 'https://api.github.com').trim()
  const parsed = new URL(raw)
  if (parsed.protocol !== 'https:') {
    throw new Error(`Unsupported GITHUB_API_URL protocol: ${parsed.protocol}`)
  }
  return raw.endsWith('/') ? raw : `${raw}/`
})()

const isAllowedFetchUrl = (url: string): boolean => {
  const parsed = new URL(url)
  return parsed.protocol === 'https:' && parsed.hostname === new URL(githubApiBaseUrl).hostname
}

const fetchJson = async <T>(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null }> => {
  if (typeof fetch !== 'function') {
    throw new Error('Fetch API unavailable in this runtime.')
  }

  if (!isAllowedFetchUrl(url)) {
    throw new Error(`Blocked outbound request to untrusted URL: ${url}`)
  }

  const response = await fetch(url, init)
  if (!response.ok) {
    return { ok: false, status: response.status, data: null }
  }
  return { ok: true, status: response.status, data: (await response.json()) as T }
}

export const buildProductionFailureCommentBody = (targetUrl: string): string => {
  const trimmedUrl = targetUrl.trim()
  return trimmedUrl
    ? `❌ Production deployment failed.\n\n🔗 ${trimmedUrl}\n\nPlease review the Vercel logs.`
    : '❌ Production deployment failed. Please review the Vercel logs.'
}

const createCommitComment = async (params: {
  owner: string
  repo: string
  sha: string
  token: string
  body: string
}): Promise<void> => {
  const url = new URL(
    `repos/${params.owner}/${params.repo}/commits/${params.sha}/comments`,
    githubApiBaseUrl,
  ).toString()
  const headers = {
    ...createGitHubRequestHeaders(params.token),
    'Content-Type': 'application/json',
  }

  const { ok, status } = await fetchJson<unknown>(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: params.body }),
  })

  if (!ok) {
    throw new Error(`Unable to create commit comment (status ${status}).`)
  }
}

export const run = async (): Promise<void> => {
  try {
    const githubToken = getInput('github-token', { required: true })
    const previewUrl = getInput('preview-url')

    const eventPath = getRequiredEnv('GITHUB_EVENT_PATH')
    const payload = getJsonFromFile<WorkflowRunPayload>(eventPath)

    const sha = (payload.workflow_run?.head_sha ?? '').trim()
    if (!sha) {
      warning('Missing workflow_run.head_sha; skipping production failure comment.')
      return
    }

    const owner = payload.repository?.owner?.login
    const repo = payload.repository?.name
    if (!owner || !repo) {
      setFailed('Missing repository metadata in event payload.')
      return
    }

    const body = buildProductionFailureCommentBody(previewUrl)

    await createCommitComment({
      owner,
      repo,
      sha,
      token: githubToken,
      body,
    })

    info('Commented on commit about production deployment failure.')
  } catch (error: unknown) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

const mainModulePath = process.argv[1]
if (mainModulePath && import.meta.url === pathToFileURL(mainModulePath).href) {
  void run()
}
