import { readFileSync } from 'fs'
import { resolve } from 'path'
import { AbortablePromise, JSDOM, ResourceLoader, type FetchOptions } from 'jsdom'
import { version } from '../../../package.json'
import { getVirtualConsole } from './virtualConsole'
import { devServer } from '../jest.config.jsdom'

export interface EnvOptions {
  html?: string
  userAgent?: string
  [option: string]: unknown
}

export const EnvOptionDefaults: EnvOptions = {
  html: `<!DOCTYPE html>`,
  userAgent: `Mozilla/5.0 (${process.platform}) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/${version}`,
}

const imageBuffer = readFileSync(resolve(process.cwd(), `src/assets/images/avatars/test-red-dot.png`))

/** Stop JSDOM from throwing errors on missing <img> resources */
class ProjectResourceLoader extends ResourceLoader {
  override fetch(url: string, options: FetchOptions) {
    if (options.element && `IMG` === options.element.tagName) {
      return Promise.resolve(imageBuffer) as unknown as AbortablePromise<Buffer>
    }
    return super.fetch(url, options)
  }
}

export const getJsdomInstance = (virtConsole?: Console, options: EnvOptions = EnvOptionDefaults) => {
  const mergedOptions = { ...EnvOptionDefaults, ...options }

  const resources = new ProjectResourceLoader({
    userAgent: mergedOptions['userAgent'] ?? undefined,
  })

  return new JSDOM(mergedOptions['html'], {
    pretendToBeVisual: true,
    resources,
    runScripts: 'dangerously',
    url: devServer,
    virtualConsole: getVirtualConsole(virtConsole ?? console),
    ...mergedOptions,
  })
}
