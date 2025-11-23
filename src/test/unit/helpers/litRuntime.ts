import { isBodyElement } from '@components/scripts/assertions/elements'
import { BuildError } from '@lib/errors/BuildError'

type RegisterCallback = (_tagName: string) => void | Promise<void>

type PropertyDictionary = Record<string, unknown>

type AttributeDictionary = Record<string, string>

interface MountOptions {
  attributes?: AttributeDictionary
  properties?: PropertyDictionary
}

interface LitRuntimeContext {
  register: (_tagName: string, _registerCallback: RegisterCallback) => Promise<void>
  mount: <TElement extends HTMLElement>(_tagName: string, _options?: MountOptions) => Promise<TElement>
  cleanup: () => void
}

const ensureDocumentBody = (): HTMLBodyElement => {
  if (!document.documentElement) {
    const htmlElement = document.createElement('html')
    const headElement = document.createElement('head')
    const bodyElement = document.createElement('body')
    htmlElement.append(headElement, bodyElement)
    document.appendChild(htmlElement)
    return bodyElement
  }

  if (!document.body) {
    const bodyElement = document.createElement('body')
    document.documentElement.appendChild(bodyElement)
    return bodyElement
  }

  if (isBodyElement(document.body)) {
    return document.body
  }

  throw BuildError.fileOperation('Unable to create document body for Lit runtime tests')
}

const waitForUpdateComplete = async (element: HTMLElement): Promise<void> => {
  const maybeUpdate = (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete
  if (maybeUpdate) {
    await maybeUpdate
    return
  }

  await Promise.resolve()
}

const applyAttributes = (element: HTMLElement, attributes: AttributeDictionary = {}): void => {
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })
}

const applyProperties = (element: HTMLElement, properties: PropertyDictionary = {}): void => {
  Object.entries(properties).forEach(([name, value]) => {
    ;(element as unknown as PropertyDictionary)[name] = value
  })
}

/**
 * Provides a scoped Lit runtime harness for hydrating custom elements in unit tests.
 *
 * @param callback Callback that receives Lit runtime helpers for registering and mounting elements.
 */
export const withLitRuntime = async <TReturn>(
  callback: (_context: LitRuntimeContext) => Promise<TReturn> | TReturn,
): Promise<TReturn> => {
  const cleanup = () => {
    if (document.body) {
      document.body.replaceChildren()
    }
  }

  const register = async (tagName: string, registerCallback: RegisterCallback) => {
    if (!customElements.get(tagName)) {
      await registerCallback(tagName)
    }
  }

  const mount = async <TElement extends HTMLElement>(
    tagName: string,
    options?: MountOptions,
  ): Promise<TElement> => {
    const body = ensureDocumentBody()
    const element = document.createElement(tagName) as TElement

    if (options?.attributes) {
      applyAttributes(element, options.attributes)
    }

    if (options?.properties) {
      applyProperties(element, options.properties)
    }

    body.appendChild(element)
    await waitForUpdateComplete(element)
    return element
  }

  cleanup()

  try {
    return await callback({
      register,
      mount,
      cleanup,
    })
  } finally {
    cleanup()
  }
}
