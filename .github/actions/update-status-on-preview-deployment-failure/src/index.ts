import { getInput, info, setFailed, warning } from '@actions/core'
import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'

type WorkflowRunPullRequest = {
  number: number
}

type WorkflowRunPayload = {
  workflow_run?: {
    head_sha?: string
    pull_requests?: WorkflowRunPullRequest[]
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

const isVercelUrl = (value: unknown): value is string =>
  typeof value === 'string' && /vercel\.(app|com)/.test(value)

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
  if (parsed.protocol !== 'https:') {
    return false
  }
  const allowedHosts = new Set([new URL(githubApiBaseUrl).hostname, 'api.vercel.com'])
  return allowedHosts.has(parsed.hostname)
}

const fetchJson = async <T>(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean, status: number, data: T | null }> => {
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
  return { ok: true, status: response.status, data: await response.json() as T }
}

const resolveVercelDeploymentUrl = async (params: { rawPreviewUrl: string, sha: string }): Promise<string | null> => {
  const candidate = params.rawPreviewUrl.trim()
  if (isVercelUrl(candidate)) {
    return candidate
  }

  const vercelToken = (process.env['VERCEL_TOKEN'] ?? '').trim()
  const vercelProjectId = (process.env['VERCEL_PROJECT_ID'] ?? '').trim()
  if (!vercelToken || !vercelProjectId) {
    info('Missing Vercel credentials; cannot query deployment API.')
    return null
  }

  const query = new URLSearchParams({
    projectId: vercelProjectId,
    'meta-githubCommitSha': params.sha ?? '',
    limit: '1',
  })
  const vercelOrgId = (process.env['VERCEL_ORG_ID'] ?? '').trim()
  if (vercelOrgId) {
    query.set('teamId', vercelOrgId)
  }

  const { ok, status, data } = await fetchJson<{ deployments?: Array<{ url?: string, inspectorUrl?: string }> }>(
    `https://api.vercel.com/v6/deployments?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    },
  )

  if (!ok) {
    warning(`Unable to fetch deployment info (status ${status}).`)
    return null
  }

  const deployment = data?.deployments?.[0]
  if (deployment?.url) {
    return `https://${deployment.url}`
  }
  if (deployment?.inspectorUrl) {
    return deployment.inspectorUrl.startsWith('http')
      ? deployment.inspectorUrl
      : `https://${deployment.inspectorUrl}`
  }
  return null
}

const createGitHubRequestHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'webstackbuilders-deployment-preview-comment-on-failure-action',
})

const createPrComment = async (params: {
  owner: string
  repo: string
  issueNumber: number
  token: string
  body: string
}): Promise<void> => {
  const headers = {
    ...createGitHubRequestHeaders(params.token),
    'Content-Type': 'application/json',
  }

  const url = new URL(
    `repos/${params.owner}/${params.repo}/issues/${params.issueNumber}/comments`,
    githubApiBaseUrl,
  ).toString()
  const { ok, status } = await fetchJson<unknown>(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: params.body }),
  })

  if (!ok) {
    throw new Error(`Unable to create PR comment (status ${status}).`)
  }
}

export const buildFailureCommentBody = (params: {
  targetUrl: string
  isFallbackRunUrl: boolean
}): string => {
  const linkText = params.isFallbackRunUrl ? 'View the workflow logs' : 'Open the failed Vercel deployment'
  const linkLine = `\n\n🔗 [${linkText}](${params.targetUrl})`
  return `❌ Preview deployment failed.${linkLine}\n\nPlease review the Vercel build logs for details.`
}

export const run = async (): Promise<void> => {
  try {
    const githubToken = getInput('github-token', { required: true })
    const rawPreviewUrl = getInput('preview-url')

    const eventPath = getRequiredEnv('GITHUB_EVENT_PATH')
    const payload = getJsonFromFile<WorkflowRunPayload>(eventPath)

    const workflowRun = payload.workflow_run
    const pr = workflowRun?.pull_requests?.[0]
    const owner = payload.repository?.owner?.login
    const repo = payload.repository?.name

    if (!pr?.number) {
      warning('No pull request metadata available; skipping preview failure comment.')
      return
    }

    if (!owner || !repo) {
      setFailed('Missing repository metadata in event payload.')
      return
    }

    const fallbackRunUrl = `https://github.com/${owner}/${repo}/actions/runs/${process.env['GITHUB_RUN_ID'] ?? ''}`
    const sha = workflowRun?.head_sha ?? ''

    let failedDeploymentUrl = await resolveVercelDeploymentUrl({ rawPreviewUrl, sha })
    if (!failedDeploymentUrl) {
      failedDeploymentUrl = fallbackRunUrl
    }

    const body = buildFailureCommentBody({
      targetUrl: failedDeploymentUrl,
      isFallbackRunUrl: failedDeploymentUrl === fallbackRunUrl,
    })

    await createPrComment({
      owner,
      repo,
      issueNumber: pr.number,
      token: githubToken,
      body,
    })
  } catch (error: unknown) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

const mainModulePath = process.argv[1]
if (mainModulePath && import.meta.url === pathToFileURL(mainModulePath).href) {
  void run()
}
