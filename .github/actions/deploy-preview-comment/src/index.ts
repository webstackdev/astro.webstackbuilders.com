import { getInput, info, setFailed, warning } from '@actions/core'
import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'

type WorkflowRunActor = {
	login?: string
	html_url?: string
}

type WorkflowRunPullRequest = {
	number: number
}

type WorkflowRunPayload = {
	workflow_run?: {
		head_branch?: string
		head_sha?: string
		actor?: string | WorkflowRunActor
		pull_requests?: WorkflowRunPullRequest[]
	}
	repository?: {
		owner?: {
			login?: string
		}
		name?: string
	}
}

type GitHubComment = {
	id: number
	body?: string | null
}

export const commentTag = '<!-- vercel-preview-card -->'

export const isVercelUrl = (value: unknown): value is string =>
	typeof value === 'string' && /vercel\.(app|com)/.test(value)

export const buildPreviewCommentBody = (params: {
	branch: string
	sha: string
	owner: string
	repo: string
	previewUrl: string
	triggeredBy: string
}): string => {
	const shortSha = params.sha ? params.sha.slice(0, 7) : 'unknown'
	const commitUrl = params.sha
		? `https://github.com/${params.owner}/${params.repo}/commit/${params.sha}`
		: `https://github.com/${params.owner}/${params.repo}`

	return [
		commentTag,
		'✅ **Preview deployment ready**',
		'',
		'| Field | Value |',
		'| --- | --- |',
		`| Branch | \`${params.branch}\` |`,
		`| Commit | [${shortSha}](${commitUrl}) |`,
		`| Preview | <a href="${params.previewUrl}" target="_blank" rel="noopener noreferrer">Open preview</a> |`,
		'',
		`_Triggered by ${params.triggeredBy}_`,
	].join('\n')
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

const getWorkflowRunData = (payload: WorkflowRunPayload) => {
	const workflowRun = payload.workflow_run
	const pr = workflowRun?.pull_requests?.[0]
	const owner = payload.repository?.owner?.login
	const repo = payload.repository?.name
	return {
		workflowRun,
		pr,
		owner,
		repo,
	}
}

const getActorMarkdown = (
	workflowRun: WorkflowRunPayload['workflow_run'] | undefined,
	fallback: string,
): string => {
	const actorLogin = typeof workflowRun?.actor === 'string'
		? workflowRun.actor
		: workflowRun?.actor?.login

	const actor = actorLogin ?? fallback ?? 'workflow_run'
	const actorLink = typeof workflowRun?.actor === 'string'
		? null
		: workflowRun?.actor?.html_url || (actorLogin ? `https://github.com/${actorLogin}` : null)

	const actorDisplay = actor.startsWith('@') ? actor : `@${actor}`
	return actorLink ? `[${actorDisplay}](${actorLink})` : actorDisplay
}

const createGitHubRequestHeaders = (token: string) => ({
	Authorization: `Bearer ${token}`,
	Accept: 'application/vnd.github+json',
	'X-GitHub-Api-Version': '2022-11-28',
	'User-Agent': 'webstackbuilders-deploy-preview-comment-action',
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

const resolveVercelPreviewUrl = async (params: {
	rawPreviewUrl: string
	sha: string
}): Promise<string | null> => {
	const previewUrl = params.rawPreviewUrl.trim()
	if (isVercelUrl(previewUrl)) {
		return previewUrl
	}

	const vercelToken = (process.env['VERCEL_TOKEN'] ?? '').trim()
	const vercelProjectId = (process.env['VERCEL_PROJECT_ID'] ?? '').trim()
	if (!vercelToken || !vercelProjectId) {
		info('Missing Vercel credentials cannot query deployment API.')
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

const findExistingComment = async (params: {
	owner: string
	repo: string
	issueNumber: number
	token: string
	tag: string
}): Promise<GitHubComment | null> => {
	const headers = createGitHubRequestHeaders(params.token)

	for (let page = 1; page <= 50; page += 1) {
		const url = new URL(
			`repos/${params.owner}/${params.repo}/issues/${params.issueNumber}/comments?per_page=100&page=${page}`,
			githubApiBaseUrl,
		).toString()
		const { ok, status, data } = await fetchJson<GitHubComment[]>(url, { headers })
		if (!ok) {
			warning(`Unable to list PR comments (status ${status}).`)
			return null
		}
		const comments = data ?? []
		const found = comments.find((comment) => comment.body?.includes(params.tag))
		if (found) {
			return found
		}
		if (comments.length < 100) {
			return null
		}
	}

	return null
}

const upsertComment = async (params: {
	owner: string
	repo: string
	issueNumber: number
	token: string
	body: string
	existingCommentId?: number
}): Promise<void> => {
	const headers = {
		...createGitHubRequestHeaders(params.token),
		'Content-Type': 'application/json',
	}

	if (params.existingCommentId) {
		const url = new URL(
			`repos/${params.owner}/${params.repo}/issues/comments/${params.existingCommentId}`,
			githubApiBaseUrl,
		).toString()
		const { ok, status } = await fetchJson<unknown>(url, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ body: params.body }),
		})
		if (!ok) {
			throw new Error(`Unable to update PR comment (status ${status}).`)
		}
		return
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

export const run = async (): Promise<void> => {
	try {
		const githubToken = getInput('github-token', { required: true })
		const rawPreviewUrl = getInput('preview-url')

		const eventPath = getRequiredEnv('GITHUB_EVENT_PATH')
		const payload = getJsonFromFile<WorkflowRunPayload>(eventPath)
		const { workflowRun, pr, owner, repo } = getWorkflowRunData(payload)

		if (!pr?.number) {
			warning('Missing pull request metadata skipping preview success comment.')
			return
		}
		if (!owner || !repo) {
			setFailed('Missing repository metadata in event payload.')
			return
		}

		const branch = workflowRun?.head_branch ?? 'unknown-branch'
		const sha = workflowRun?.head_sha ?? ''

		const actorFallback = (process.env['GITHUB_ACTOR'] ?? '').trim() || 'workflow_run'
		const triggeredBy = getActorMarkdown(workflowRun, actorFallback)

		const previewUrl = await resolveVercelPreviewUrl({ rawPreviewUrl, sha })
		if (!isVercelUrl(previewUrl)) {
			warning('Unable to resolve Vercel preview URL skipping preview success comment.')
			return
		}

		const body = buildPreviewCommentBody({
			branch,
			sha,
			owner,
			repo,
			previewUrl,
			triggeredBy,
		})

		const existing = await findExistingComment({
			owner,
			repo,
			issueNumber: pr.number,
			token: githubToken,
			tag: commentTag,
		})

		const upsertParams: {
			owner: string
			repo: string
			issueNumber: number
			token: string
			body: string
			existingCommentId?: number
		} = {
			owner,
			repo,
			issueNumber: pr.number,
			token: githubToken,
			body,
		}

		if (typeof existing?.id === 'number') {
			upsertParams.existingCommentId = existing.id
		}

		await upsertComment(upsertParams)
	} catch (error: unknown) {
		setFailed(error instanceof Error ? error.message : String(error))
	}
}

const mainModulePath = process.argv[1]
if (mainModulePath && import.meta.url === pathToFileURL(mainModulePath).href) {
	void run()
}
