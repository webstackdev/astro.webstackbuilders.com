/**
 * Provides JSDOM utilities for Lit-powered Astro component tests.
 * The helpers create scoped browser globals, load WebComponentModule contracts,
 * render Astro templates into sanitized DOM trees, and assert against the upgraded elements.
 */
import { JSDOM } from 'jsdom'
import type { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { BuildError } from '@lib/errors/BuildError'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

type DomGlobalKey =
	| 'window'
	| 'document'
	| 'customElements'
	| 'HTMLElement'
	| 'Node'
	| 'Element'
	| 'Event'
	| 'CustomEvent'
	| 'HTMLAnchorElement'
	| 'HTMLDivElement'
	| 'sessionStorage'
	| 'localStorage'
	| 'SVGElement'
	| 'SVGSVGElement'
	| 'HTMLParagraphElement'
	| 'HTMLFormElement'
	| 'HTMLInputElement'
	| 'HTMLButtonElement'
	| 'HTMLSpanElement'
	| 'HTMLTextAreaElement'
	| 'FormData'
type DomGlobals = Partial<Record<DomGlobalKey, unknown>>

const DOM_GLOBAL_KEYS: DomGlobalKey[] = [
	'window',
	'document',
	'customElements',
	'HTMLElement',
	'Node',
	'Element',
	'Event',
	'CustomEvent',
	'HTMLAnchorElement',
	'HTMLDivElement',
	'sessionStorage',
	'localStorage',
	'SVGElement',
	'SVGSVGElement',
	'HTMLParagraphElement',
	'HTMLFormElement',
	'HTMLInputElement',
	'HTMLButtonElement',
	'HTMLSpanElement',
	'HTMLTextAreaElement',
	'FormData',
]

type DomWindow = Window & typeof globalThis

let sharedDom: JSDOM | null = null
let sharedWindow: DomWindow | null = null

const getSharedWindow = (): DomWindow => {
	if (!sharedDom || !sharedWindow) {
		sharedDom = new JSDOM('<!doctype html><html><body></body></html>', {
			pretendToBeVisual: true,
			url: 'http://localhost',
		})
		sharedWindow = sharedDom.window as unknown as DomWindow
	}

	return sharedWindow
}

export type AstroComponentInstance = Parameters<AstroContainer['renderToString']>[0]
export type AstroRenderArgs = Parameters<AstroContainer['renderToString']>[1]
export type RenderResult = Awaited<ReturnType<AstroContainer['renderToString']>>

export interface JsdomEnvironmentContext {
	window: DomWindow
}

export type JsdomEnvironmentCallback<TReturn> = (
	_context: JsdomEnvironmentContext,
) => Promise<TReturn> | TReturn

export const setGlobalValue = (key: DomGlobalKey, value: unknown): void => {
	if (value === undefined) {
		delete (globalThis as Record<string, unknown>)[key]
		return
	}

	;(globalThis as Record<string, unknown>)[key] = value
}

const captureGlobalSnapshot = (): DomGlobals => {
	const globalObject = globalThis as Record<string, unknown>
	return DOM_GLOBAL_KEYS.reduce<DomGlobals>((snapshot, key) => {
		snapshot[key] = globalObject[key]
		return snapshot
	}, {})
}

const installWindowGlobals = (window: DomWindow): void => {
	setGlobalValue('window', window)
	setGlobalValue('document', window.document)
	setGlobalValue('customElements', window.customElements)
	setGlobalValue('HTMLElement', window.HTMLElement)
	setGlobalValue('Node', window.Node)
	setGlobalValue('Element', window.Element)
	setGlobalValue('Event', window.Event)
	setGlobalValue('CustomEvent', window.CustomEvent)
	setGlobalValue('SVGElement', window.SVGElement)
	setGlobalValue('SVGSVGElement', window.SVGSVGElement)
	setGlobalValue('HTMLParagraphElement', window.HTMLParagraphElement)
	setGlobalValue('HTMLFormElement', window.HTMLFormElement)
	setGlobalValue('HTMLInputElement', window.HTMLInputElement)
	setGlobalValue('HTMLButtonElement', window.HTMLButtonElement)
	setGlobalValue('HTMLSpanElement', window.HTMLSpanElement)
	setGlobalValue('HTMLTextAreaElement', window.HTMLTextAreaElement)
	setGlobalValue('HTMLAnchorElement', window.HTMLAnchorElement)
	setGlobalValue('HTMLDivElement', window.HTMLDivElement)
	setGlobalValue('FormData', window.FormData)
	setGlobalValue('sessionStorage', window.sessionStorage)
	setGlobalValue('localStorage', window.localStorage)
}

const restoreGlobalSnapshot = (snapshot: DomGlobals): void => {
	for (const key of DOM_GLOBAL_KEYS) {
		setGlobalValue(key, snapshot[key])
	}
}

/**
 * Provides a scoped JSDOM environment for DOM-centric tests.
 */
export const withJsdomEnvironment = async <TReturn>(
	callback: JsdomEnvironmentCallback<TReturn>,
): Promise<TReturn> => {
	const window = getSharedWindow()
	const snapshot = captureGlobalSnapshot()

	installWindowGlobals(window)

	try {
		return await callback({ window })
	} finally {
		restoreGlobalSnapshot(snapshot)
	}
}

export type ModuleElement<TModule extends WebComponentModule> = TModule extends WebComponentModule<infer TElement>
	? TElement
	: HTMLElement

export interface RenderInJsdomOptions<TModule extends WebComponentModule> {
	container: AstroContainer
	component: AstroComponentInstance
	args?: AstroRenderArgs
	moduleLoader: () => Promise<TModule> | TModule
	selector?: string
	waitForReady?: (_element: ModuleElement<TModule>) => Promise<void> | void
	assert: (_context: {
		element: ModuleElement<TModule>
		window: DomWindow
		module: TModule
		renderResult: RenderResult
	}) => Promise<void> | void
}

const defaultWaitForReady = async (_element?: unknown) => {}

const componentModuleImporters = import.meta.glob<ModuleImport<WebComponentModule>>(
	'/src/components/**/*.ts',
)

const sanitizeRenderedHtml = (html: string): string => {
	const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '')
	return withoutScripts.replace(/\sdata-astro-cid-[^=\s>]+="[^"]*"/gi, '')
}

const hasFileExtension = (specifier: string): boolean => /\.[a-zA-Z0-9]+$/.test(specifier)

const normalizeModuleSpecifier = (moduleSpecifier: string): string => {
	const ensureExtension = (specifier: string) => (hasFileExtension(specifier) ? specifier : `${specifier}.ts`)

	if (moduleSpecifier.startsWith('@components/')) {
		const relativePath = moduleSpecifier.slice('@components/'.length)
		return `/src/components/${ensureExtension(relativePath)}`
	}

	return ensureExtension(moduleSpecifier)
}

export type JsdomRenderer<TModule extends WebComponentModule> = (
	_options: RenderInJsdomOptions<TModule>,
) => Promise<void>

export const renderInJsdom = async <TModule extends WebComponentModule>(
	_options: RenderInJsdomOptions<TModule>,
): Promise<void> => {
	const { container, component, args, moduleLoader, selector, waitForReady = defaultWaitForReady, assert } = _options

	await withJsdomEnvironment(async ({ window }) => {
		const module = await moduleLoader()
		await module.registerWebComponent(module.registeredName)

		const renderedHtml: RenderResult = await container.renderToString(component, args)

		const sanitizedHtml = sanitizeRenderedHtml(renderedHtml)
		window.document.body.innerHTML = sanitizedHtml

		const querySelector = selector ?? module.registeredName
		const element = window.document.querySelector(querySelector) as ModuleElement<TModule> | null
		if (!element) {
			throw BuildError.fileOperation(
				`Unable to locate rendered element for selector "${querySelector}" during JSDOM rendering`,
			)
		}

		const registeredCtor = window.customElements.get(module.registeredName) as
			| CustomElementConstructor
			| undefined
		const expectedCtor: CustomElementConstructor = module.componentCtor
		if (!registeredCtor || registeredCtor !== expectedCtor) {
			throw BuildError.fileOperation(
				`Custom element "${module.registeredName}" is not registered with the expected constructor`,
			)
		}

		await waitForReady(element)
		await assert({ element, window, module, renderResult: renderedHtml })
	})
}

interface ModuleImport<TModule extends WebComponentModule> {
	webComponentModule?: TModule
}

export const loadWebComponentModule = async <TModule extends WebComponentModule>(
	moduleSpecifier: string,
): Promise<TModule> => {
	const normalizedSpecifier = normalizeModuleSpecifier(moduleSpecifier)
	const importer = componentModuleImporters[normalizedSpecifier]

	if (!importer) {
		throw BuildError.fileOperation(
			`Unable to locate a component module for specifier "${moduleSpecifier}" (resolved to "${normalizedSpecifier}")`,
		)
	}

	const imported = (await importer()) as ModuleImport<TModule>

	if (!imported.webComponentModule) {
		throw BuildError.fileOperation(
			`Module "${moduleSpecifier}" does not export a webComponentModule contract`,
		)
	}

	return imported.webComponentModule
}

export interface ExecuteRenderOptions<TModule extends WebComponentModule> {
	container: AstroContainer
	component: AstroComponentInstance
	moduleSpecifier: string
	args?: AstroRenderArgs
	selector?: string
	waitForReady?: (_element: ModuleElement<TModule>) => Promise<void> | void
	renderer?: JsdomRenderer<TModule>
	assert: (_context: {
		element: ModuleElement<TModule>
		module: TModule
		renderResult: RenderResult
		window?: DomWindow
	}) => Promise<void> | void
}

export const executeRender = async <TModule extends WebComponentModule>(
	options: ExecuteRenderOptions<TModule>,
): Promise<void> => {
	const { container, component, moduleSpecifier, args, selector, waitForReady, renderer, assert } = options

	const rendererToUse: JsdomRenderer<TModule> = renderer
		? renderer
		: (rendererOptions) => renderInJsdom<TModule>(rendererOptions)

	const rendererOptions: RenderInJsdomOptions<TModule> = {
		container,
		component,
		args,
		moduleLoader: () => loadWebComponentModule<TModule>(moduleSpecifier),
		assert: async ({ element, module, renderResult, window }) => {
			await assert({ element, module, renderResult, window })
		},
	}

	if (typeof selector === 'string') {
		rendererOptions.selector = selector
	}

	if (waitForReady) {
		rendererOptions.waitForReady = waitForReady
	}

	await rendererToUse(rendererOptions)
}
