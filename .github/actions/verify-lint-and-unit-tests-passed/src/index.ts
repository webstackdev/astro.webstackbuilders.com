import { getInput, info, notice, setFailed } from '@actions/core'
import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'

type WorkflowRunPayload = {
  workflow_run?: {
    id?: number
    head_branch?: string
    event?: string
  }
  repository?: {
    owner?: {
      login?: string
    }
    name?: string
  }
}

type WorkflowJob = {
  name?: string
  conclusion?: string | null
}

type ListJobsResponse = {
  jobs?: WorkflowJob[]
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
  'User-Agent': 'webstackbuilders-verify-lint-and-unit-tests-passed-action',
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

const listAllJobsForRun = async (params: {
  owner: string
  repo: string
  runId: number
  token: string
}): Promise<WorkflowJob[]> => {
  const headers = createGitHubRequestHeaders(params.token)

  const allJobs: WorkflowJob[] = []
  for (let page = 1; page <= 10; page += 1) {
    const url = new URL(
      `repos/${params.owner}/${params.repo}/actions/runs/${params.runId}/jobs?per_page=100&page=${page}`,
      githubApiBaseUrl,
    ).toString()
    const { ok, status, data } = await fetchJson<ListJobsResponse>(url, { headers })

    if (!ok) {
      throw new Error(`Unable to list jobs for workflow run (status ${status}).`)
    }

    const jobs = data?.jobs ?? []
    allJobs.push(...jobs)

    if (jobs.length < 100) {
      break
    }
  }

  return allJobs
}

export const run = async (): Promise<void> => {
  try {
    const githubToken = getInput('github-token', { required: true })

    const eventPath = getRequiredEnv('GITHUB_EVENT_PATH')
    const payload = getJsonFromFile<WorkflowRunPayload>(eventPath)

    const workflowRun = payload.workflow_run
    const runId = workflowRun?.id
    const branch = workflowRun?.head_branch ?? ''
    const event = workflowRun?.event ?? ''

    const isHotfix = branch.startsWith('hotfix/')
    if (event === 'pull_request' && isHotfix) {
      notice('Hotfix branch: skipping CI verification requirements.')
      return
    }

    const owner = payload.repository?.owner?.login
    const repo = payload.repository?.name

    if (!owner || !repo) {
      setFailed('Missing repository metadata in event payload.')
      return
    }

    if (typeof runId !== 'number') {
      setFailed('Missing workflow_run.id in event payload.')
      return
    }

    const requiredJobs = ['Lint', 'Unit Tests']
    const jobs = await listAllJobsForRun({ owner, repo, runId, token: githubToken })

    const missing = requiredJobs.filter((requiredName) => {
      const job = jobs.find((entry) => entry.name === requiredName)
      return !job || job.conclusion !== 'success'
    })

    if (missing.length > 0) {
      setFailed(`Required CI jobs missing or failed: ${missing.join(', ')}`)
      return
    }

    info('Required CI jobs succeeded.')
  } catch (error: unknown) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

const mainModulePath = process.argv[1]
if (mainModulePath && import.meta.url === pathToFileURL(mainModulePath).href) {
  void run()
}
