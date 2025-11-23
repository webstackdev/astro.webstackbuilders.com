import { Window } from 'happy-dom'
import type { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { BuildError } from '@lib/errors/BuildError'

type HappyDomGlobalKey = 'window' | 'document' | 'customElements' | 'HTMLElement'
type HappyDomGlobals = Partial<Record<HappyDomGlobalKey, unknown>>

export type AstroComponentInstance = Parameters<AstroContainer['renderToString']>[0]
export type AstroRenderArgs = Parameters<AstroContainer['renderToString']>[1]
export type RenderResult = Awaited<ReturnType<AstroContainer['renderToString']>>

export interface HappyDomEnvironmentContext {
	window: Window
}

export type HappyDomEnvironmentCallback<TReturn> = (
	_context: HappyDomEnvironmentContext,
) => Promise<TReturn> | TReturn

export const setGlobalValue = (key: HappyDomGlobalKey, value: unknown): void => {
	if (value === undefined) {
		delete (globalThis as Record<string, unknown>)[key]
		return
	}

	;(globalThis as Record<string, unknown>)[key] = value
}

const captureGlobalSnapshot = (): HappyDomGlobals => {
	const globalObject = globalThis as Record<string, unknown>
	return {
		window: globalObject['window'],
		document: globalObject['document'],
		customElements: globalObject['customElements'],
		HTMLElement: globalObject['HTMLElement'],
	}
}

const installHappyDomGlobals = (window: Window): void => {
	setGlobalValue('window', window)
	setGlobalValue('document', window.document)
	setGlobalValue('customElements', window.customElements)
	setGlobalValue('HTMLElement', window.HTMLElement)
}

const restoreGlobalSnapshot = (snapshot: HappyDomGlobals): void => {
	setGlobalValue('window', snapshot.window)
	setGlobalValue('document', snapshot.document)
	setGlobalValue('customElements', snapshot.customElements)
	setGlobalValue('HTMLElement', snapshot.HTMLElement)
}

/**
 * Provides a scoped Happy DOM environment for DOM-centric tests.
 */
export const withHappyDomEnvironment = async <TReturn>(
	callback: HappyDomEnvironmentCallback<TReturn>,
): Promise<TReturn> => {
	const window = new Window()
	const snapshot = captureGlobalSnapshot()

	installHappyDomGlobals(window)

	try {
		return await callback({ window })
	} finally {
		restoreGlobalSnapshot(snapshot)
		await window.happyDOM?.whenAsyncComplete?.()
		await window.happyDOM?.close?.()
	}
}

interface RenderInHappyDomOptions<TElement, THydrateResult> {
	container: AstroContainer
	component: AstroComponentInstance
	args?: AstroRenderArgs
	selector: string
	hydrate?: () => Promise<THydrateResult> | THydrateResult
	waitForReady?: (_element: TElement) => Promise<void> | void
	assert: (_context: {
		element: TElement
		window: Window
		hydrateResult: THydrateResult
		renderResult: RenderResult
	}) => Promise<void> | void
}

const defaultWaitForReady = async () => {}

export const renderInHappyDom = async <TElement, THydrateResult = void>(
	options: RenderInHappyDomOptions<TElement, THydrateResult>,
): Promise<void> => {
	const { container, component, args, selector, hydrate, waitForReady = defaultWaitForReady, assert } = options

	await withHappyDomEnvironment(async ({ window }) => {
		const renderedHtml: RenderResult = await container.renderToString(component, args)

		window.document.body.innerHTML = renderedHtml
		window.document.querySelectorAll('script').forEach((script) => script.remove())

		const hydrateResult = (await hydrate?.()) as THydrateResult

		const element = window.document.querySelector(selector) as TElement | null
		if (!element) {
			throw BuildError.fileOperation(
				`Unable to locate rendered element for selector "${selector}" during Happy DOM rendering`,
			)
		}

		await waitForReady(element)
		await assert({ element, window, hydrateResult, renderResult: renderedHtml })
	})
}
