import { Window } from 'happy-dom'
import type HappyDomNode from 'happy-dom/lib/nodes/node/Node'
import type HappyDomDocumentFragment from 'happy-dom/lib/nodes/document-fragment/DocumentFragment'
import type { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { BuildError } from '@lib/errors/BuildError'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

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

export type ModuleElement<TModule extends WebComponentModule> = TModule extends WebComponentModule<infer TElement>
	? TElement
	: HTMLElement

export interface RenderInHappyDomOptions<TModule extends WebComponentModule> {
	container: AstroContainer
	component: AstroComponentInstance
	args?: AstroRenderArgs
	moduleLoader: () => Promise<TModule> | TModule
	selector?: string
	waitForReady?: (_element: ModuleElement<TModule>) => Promise<void> | void
	assert: (_context: {
		element: ModuleElement<TModule>
		window: Window
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

export type HappyDomRenderer<TModule extends WebComponentModule> = (
	_options: RenderInHappyDomOptions<TModule>,
) => Promise<void>

export const renderInHappyDom = async <TModule extends WebComponentModule>(
	_options: RenderInHappyDomOptions<TModule>,
): Promise<void> => {
	const { container, component, args, moduleLoader, selector, waitForReady = defaultWaitForReady, assert } = _options

	await withHappyDomEnvironment(async ({ window }) => {
		const module = await moduleLoader()

		const renderedHtml: RenderResult = await container.renderToString(component, args)

		const sanitizedHtml = sanitizeRenderedHtml(renderedHtml)
		const template = window.document.createElement('template')
		template.innerHTML = sanitizedHtml
		await module.registerWebComponent(module.registeredName)
		const fragment = template.content.cloneNode(true) as HappyDomDocumentFragment
		const placeholders = Array.from(fragment.querySelectorAll(module.registeredName))
		placeholders.forEach((placeholder) => {
			const upgradedElement = window.document.createElement(module.registeredName)
			Array.from(placeholder.attributes).forEach((attribute) => {
				upgradedElement.setAttribute(attribute.name, attribute.value ?? '')
			})
			while (placeholder.firstChild) {
				upgradedElement.appendChild(placeholder.firstChild as HappyDomNode)
			}
			placeholder.replaceWith(upgradedElement as HappyDomNode)
		})
		window.document.body.innerHTML = ''
		window.document.body.appendChild(fragment as HappyDomNode)

		const querySelector = selector ?? module.registeredName
		const element = window.document.querySelector(querySelector) as ModuleElement<TModule> | null
		if (!element) {
			throw BuildError.fileOperation(
				`Unable to locate rendered element for selector "${querySelector}" during Happy DOM rendering`,
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
	renderer?: HappyDomRenderer<TModule>
	assert: (_context: { element: ModuleElement<TModule>; module: TModule; renderResult: RenderResult }) => Promise<void> | void
}

export const executeRender = async <TModule extends WebComponentModule>(
	options: ExecuteRenderOptions<TModule>,
): Promise<void> => {
	const { container, component, moduleSpecifier, args, selector, waitForReady, renderer, assert } = options

	const rendererToUse: HappyDomRenderer<TModule> = renderer
		? renderer
		: (rendererOptions) => renderInHappyDom<TModule>(rendererOptions)

	const rendererOptions: RenderInHappyDomOptions<TModule> = {
		container,
		component,
		args,
		moduleLoader: () => loadWebComponentModule<TModule>(moduleSpecifier),
		assert: async ({ element, module, renderResult }) => {
			await assert({ element, module, renderResult })
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
