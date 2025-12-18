import { getInput, info, setFailed, warning } from '@actions/core'
import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'

type WorkflowRunPayload = {
  workflow_run?: {
    head_sha?: string
    head_branch?: string
  }
  repository?: {
    owner?: {
      login?: string
    }
    name?: string
  }
}

type CheckRun = {
  id: number
  name?: string
}

type ListCheckRunsResponse = {
  check_runs?: CheckRun[]
}

const checkName = 'Deploy Preview to Vercel'

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

const getOptionalInputOrEnv = (inputName: string, envName: string): string => {
  const input = getInput(inputName).trim()
  if (input) {
    return input
  }
  return (process.env[envName] ?? '').trim()
}

const createGitHubRequestHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'webstackbuilders-publish-preview-status-action',
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

const getRepoFromPayload = (payload: WorkflowRunPayload) => {
  const owner = payload.repository?.owner?.login
  const repo = payload.repository?.name
  return { owner, repo }
}

const listCheckRunsForRef = async (params: {
  owner: string
  repo: string
  sha: string
  token: string
}): Promise<CheckRun[]> => {
  const url = new URL(
    `repos/${params.owner}/${params.repo}/commits/${params.sha}/check-runs?filter=latest&per_page=100`,
    githubApiBaseUrl,
  ).toString()
  const { ok, status, data } = await fetchJson<ListCheckRunsResponse>(url, {
    headers: createGitHubRequestHeaders(params.token),
  })

  if (!ok) {
    throw new Error(`Unable to list check runs (status ${status}).`)
  }

  return data?.check_runs ?? []
}

const upsertCheckRun = async (params: {
  owner: string
  repo: string
  sha: string
  token: string
  conclusion: 'success' | 'failure'
  summary: string
  detailsUrl: string
}): Promise<void> => {
  const completedAt = new Date().toISOString()
  const output = {
    title: checkName,
    summary: `${params.summary}\n\nDetails: ${params.detailsUrl}`,
  }

  const headers = {
    ...createGitHubRequestHeaders(params.token),
    'Content-Type': 'application/json',
  }

  const existing = (await listCheckRunsForRef({
    owner: params.owner,
    repo: params.repo,
    sha: params.sha,
    token: params.token,
  })).find((run) => run.name === checkName)

  if (existing) {
    const url = new URL(
      `repos/${params.owner}/${params.repo}/check-runs/${existing.id}`,
      githubApiBaseUrl,
    ).toString()
    const { ok, status } = await fetchJson<unknown>(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'completed',
        conclusion: params.conclusion,
        completed_at: completedAt,
        output,
        details_url: params.detailsUrl,
      }),
    })

    if (!ok) {
      throw new Error(`Unable to update check run (status ${status}).`)
    }

    return
  }

  const url = new URL(`repos/${params.owner}/${params.repo}/check-runs`, githubApiBaseUrl).toString()
  const { ok, status } = await fetchJson<unknown>(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: checkName,
      head_sha: params.sha,
      status: 'completed',
      conclusion: params.conclusion,
      completed_at: completedAt,
      output,
      details_url: params.detailsUrl,
    }),
  })

  if (!ok) {
    throw new Error(`Unable to create check run (status ${status}).`)
  }
}

export const run = async (): Promise<void> => {
  try {
    const githubToken = getInput('github-token', { required: true })

    const eventPath = getRequiredEnv('GITHUB_EVENT_PATH')
    const payload = getJsonFromFile<WorkflowRunPayload>(eventPath)

    const workflowRun = payload.workflow_run
    const sha = (workflowRun?.head_sha ?? '').trim()
    if (!sha) {
      warning('Missing workflow_run.head_sha; cannot publish check run.')
      return
    }

    const { owner, repo } = getRepoFromPayload(payload)
    if (!owner || !repo) {
      setFailed('Missing repository metadata in event payload.')
      return
    }

    const branch = workflowRun?.head_branch ?? ''
    const isHotfix = branch.startsWith('hotfix/')

    const verifyResult = getOptionalInputOrEnv('verify-result', 'VERIFY_RESULT') || 'unknown'
    const deployResult = getOptionalInputOrEnv('deploy-result', 'DEPLOY_RESULT') || 'unknown'
    const previewUrl = getOptionalInputOrEnv('preview-url', 'PREVIEW_URL')

    const runId = (process.env['GITHUB_RUN_ID'] ?? '').trim()
    const detailsUrl = runId
      ? `https://github.com/${owner}/${repo}/actions/runs/${runId}`
      : `https://github.com/${owner}/${repo}`

    const result: { conclusion: 'success' | 'failure'; summary: string } = (() => {
      if (isHotfix) {
        return { conclusion: 'success', summary: 'Hotfix branch: preview deploy intentionally skipped.' }
      }

      if (verifyResult !== 'success') {
        return { conclusion: 'failure', summary: `CI verification failed (${verifyResult}).` }
      }

      if (deployResult === 'success') {
        return {
          conclusion: 'success',
          summary: previewUrl ? `Preview deployed: ${previewUrl}` : 'Preview deployed.',
        }
      }

      return { conclusion: 'failure', summary: `Preview deployment failed (${deployResult}).` }
    })()

    await upsertCheckRun({
      owner,
      repo,
      sha,
      token: githubToken,
      conclusion: result.conclusion,
      summary: result.summary,
      detailsUrl,
    })

    info(`Published check run: ${checkName} (${result.conclusion}).`)
  } catch (error: unknown) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

const mainModulePath = process.argv[1]
if (mainModulePath && import.meta.url === pathToFileURL(mainModulePath).href) {
  void run()
}
