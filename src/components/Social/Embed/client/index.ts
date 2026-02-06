import { cacheEmbed, getCachedEmbed } from '@components/scripts/store'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  assertHasEmbedPlaceholder,
  hasScriptWithSrc,
  queryFirstIframe,
  queryIframes,
  queryScripts,
  queryStylesheetLinkByHref,
  queryUnmanagedEmbedElements,
  queryVideos,
  removeEmbedLoadingStatusNode,
} from './selectors'

/**
 * Platform types supported by the Embed component
 */
export type EmbedPlatform =
  | 'x'
  | 'linkedin'
  | 'bluesky'
  | 'mastodon'
  | 'youtube'
  | 'github-gist'
  | 'codepen'

const embedPlatforms: EmbedPlatform[] = [
  'x',
  'linkedin',
  'bluesky',
  'mastodon',
  'youtube',
  'github-gist',
  'codepen',
]

const isEmbedPlatform = (value: unknown): value is EmbedPlatform => {
  return typeof value === 'string' && embedPlatforms.includes(value as EmbedPlatform)
}

/**
 * oEmbed response structure
 */
interface OEmbedResponse {
  html: string
  width?: number
  height?: number
  title?: string
  author_name?: string
  author_url?: string
  provider_name?: string
  provider_url?: string
  cache_age?: number
  thumbnail_url?: string
  thumbnail_width?: number
  thumbnail_height?: number
  version?: string
  type?: string
}

const safeParseAbsoluteHttpUrl = (value: string): URL | null => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const hostMatchesDomain = (hostname: string, domain: string): boolean => {
  const normalizedHost = hostname.toLowerCase()
  const normalizedDomain = domain.toLowerCase()

  return normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`)
}

const isUrlOnAllowedDomains = (value: string, allowedDomains: string[]): boolean => {
  const parsed = safeParseAbsoluteHttpUrl(value)
  if (!parsed) return false

  return allowedDomains.some(domain => hostMatchesDomain(parsed.hostname, domain))
}

const mastodonStatusPathMatchers: RegExp[] = [
  /^\/\@[^\/]+\/\d+(?:\/.*)?$/,
  /^\/users\/[^\/]+\/statuses\/\d+(?:\/.*)?$/,
]

const isMastodonStatusUrl = (value: string): boolean => {
  const parsed = safeParseAbsoluteHttpUrl(value)
  if (!parsed) return false

  return mastodonStatusPathMatchers.some(matcher => matcher.test(parsed.pathname))
}

/**
 * Detect the embed platform for a given URL.
 *
 * Uses URL parsing + hostname allowlists to avoid substring-matching attacks.
 */
export const detectEmbedPlatform = (url: string): EmbedPlatform => {
  if (isUrlOnAllowedDomains(url, ['twitter.com', 'x.com'])) {
    return 'x'
  }
  if (isUrlOnAllowedDomains(url, ['linkedin.com'])) {
    return 'linkedin'
  }
  if (isUrlOnAllowedDomains(url, ['bsky.app', 'bsky.social'])) {
    return 'bluesky'
  }
  if (isMastodonStatusUrl(url)) {
    return 'mastodon'
  }
  if (isUrlOnAllowedDomains(url, ['youtube.com', 'youtu.be'])) {
    return 'youtube'
  }
  if (isUrlOnAllowedDomains(url, ['gist.github.com'])) {
    return 'github-gist'
  }
  if (isUrlOnAllowedDomains(url, ['codepen.io'])) {
    return 'codepen'
  }

  console.warn(`Could not detect platform for URL: ${url}, defaulting to 'x'`)
  return 'x'
}

/**
 * Manager class for all social embeds using singleton pattern
 * Can be registered directly: registerScript(EmbedManager)
 */
export class EmbedManager {
  private static instance: EmbedManager | null = null
  private embeds: Map<HTMLElement, EmbedInstance> = new Map()
  private initialized = false

  static scriptName = 'EmbedManager'

  static init(): void {
    const context = { scriptName: EmbedManager.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      const instance = EmbedManager.getInstance()

      if (instance.initialized) {
        instance.discoverNewEmbeds()
        return
      }

      instance.discoverNewEmbeds()
      instance.initialized = true
    } catch (error) {
      // Embeds are optional enhancements
      handleScriptError(error, context)
    }
  }

  static pause(): void {
    EmbedManager.getInstance().pauseAll()
  }

  static resume(): void {
    EmbedManager.getInstance().resumeAll()
  }

  private static getInstance(): EmbedManager {
    if (!EmbedManager.instance) {
      EmbedManager.instance = new EmbedManager()
    }
    return EmbedManager.instance
  }

  private constructor() {}

  private discoverNewEmbeds(): void {
    const context = { scriptName: EmbedManager.scriptName, operation: 'discoverEmbeds' }
    addScriptBreadcrumb(context)

    try {
      const embedElements = queryUnmanagedEmbedElements(document)

      embedElements.forEach((element, index) => {
        try {
          const rawPlatform = element.dataset['embedPlatform']
          const platform = isEmbedPlatform(rawPlatform) ? rawPlatform : undefined
          const url = element.dataset['embedUrl']

          if (!url) {
            console.warn('Embed element missing data-embed-url attribute')
            return
          }

          const embed = new EmbedInstance(element, url, platform, this.embeds.size + index)
          embed.initialize()

          this.embeds.set(element, embed)
          element.setAttribute('data-embed-managed', 'true')
        } catch (error) {
          // One embed failing shouldn't break all embeds
          handleScriptError(error, { scriptName: EmbedManager.scriptName, operation: 'initEmbed' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private pauseAll(): void {
    const context = { scriptName: EmbedManager.scriptName, operation: 'pauseAll' }
    addScriptBreadcrumb(context)

    try {
      this.embeds.forEach(embed => {
        try {
          embed.pause()
        } catch (error) {
          handleScriptError(error, { scriptName: EmbedManager.scriptName, operation: 'pauseEmbed' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private resumeAll(): void {
    const context = { scriptName: EmbedManager.scriptName, operation: 'resumeAll' }
    addScriptBreadcrumb(context)

    try {
      this.embeds.forEach(embed => {
        try {
          embed.resume()
        } catch (error) {
          handleScriptError(error, {
            scriptName: EmbedManager.scriptName,
            operation: 'resumeEmbed',
          })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private cleanup(): void {
    const context = { scriptName: EmbedManager.scriptName, operation: 'cleanup' }
    addScriptBreadcrumb(context)

    try {
      const toRemove: HTMLElement[] = []

      this.embeds.forEach((embed, element) => {
        try {
          if (!document.contains(element)) {
            embed.destroy()
            toRemove.push(element)
          }
        } catch (error) {
          handleScriptError(error, {
            scriptName: EmbedManager.scriptName,
            operation: 'checkStaleEmbed',
          })
        }
      })

      toRemove.forEach(element => {
        try {
          this.embeds.delete(element)
        } catch (error) {
          handleScriptError(error, {
            scriptName: EmbedManager.scriptName,
            operation: 'deleteEmbed',
          })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  static reset(): void {
    const instance = EmbedManager.instance
    if (instance) {
      instance.cleanup()
      instance.initialized = false
    }
  }
}

/**
 * Individual embed instance
 */
class EmbedInstance {
  private container: HTMLElement
  private url: string
  private platform: EmbedPlatform
  private observer: IntersectionObserver | null = null
  private loaded = false
  private paused = false

  private embedWidth?: number
  private embedHeight?: number

  // Cache settings
  private static readonly CACHE_PREFIX = 'embed_cache_'
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours

  constructor(
    container: HTMLElement,
    url: string,
    platform: EmbedPlatform | undefined,
    _instanceId: number
  ) {
    this.container = container
    this.url = url
    this.platform = platform || this.detectPlatform(url)

    const width = Number.parseInt(container.dataset['embedWidth'] ?? '', 10)
    const height = Number.parseInt(container.dataset['embedHeight'] ?? '', 10)
    if (Number.isFinite(width) && width > 0) this.embedWidth = width
    if (Number.isFinite(height) && height > 0) this.embedHeight = height
  }

  private getYouTubeDimensions(): { width: number; height: number } {
    const defaultWidth = 560
    const defaultHeight = 315

    if (this.embedWidth && this.embedHeight) {
      return { width: this.embedWidth, height: this.embedHeight }
    }

    if (this.embedWidth && !this.embedHeight) {
      return { width: this.embedWidth, height: Math.round((this.embedWidth * 9) / 16) }
    }

    if (!this.embedWidth && this.embedHeight) {
      return { width: Math.round((this.embedHeight * 16) / 9), height: this.embedHeight }
    }

    return { width: defaultWidth, height: defaultHeight }
  }

  private setAriaBusy(isBusy: boolean): void {
    this.container.setAttribute('aria-busy', isBusy ? 'true' : 'false')
  }

  private removeLoadingStatusNode(): void {
    removeEmbedLoadingStatusNode(this.container)
  }

  private ensureIframeTitles(root: ParentNode, fallbackTitle: string): void {
    const titleToUse = fallbackTitle.trim().length > 0 ? fallbackTitle : 'Embedded content'

    queryIframes(root).forEach(iframe => {
      const title = iframe.getAttribute('title')
      if (!title || title.trim().length === 0) {
        iframe.setAttribute('title', titleToUse)
      }
    })
  }

  initialize(): void {
    const context = { scriptName: 'EmbedInstance', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.setAriaBusy(true)

      // LinkedIn embeds are already complete HTML, no need for intersection observer
      if (this.platform === 'linkedin') {
        this.handleLinkedInEmbed()
        return
      }

      // Setup intersection observer for lazy loading
      this.setupIntersectionObserver()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private detectPlatform(url: string): EmbedPlatform {
    return detectEmbedPlatform(url)
  }

  private setupIntersectionObserver(): void {
    const context = { scriptName: 'EmbedInstance', operation: 'setupIntersectionObserver' }
    addScriptBreadcrumb(context)

    try {
      if (typeof IntersectionObserver === 'undefined') {
        console.warn('IntersectionObserver not supported, loading embed immediately')
        this.loadEmbed()
        return
      }

      this.observer = new IntersectionObserver(
        entries => {
          try {
            entries.forEach(entry => {
              try {
                if (entry.isIntersecting && !this.loaded && !this.paused) {
                  this.loadEmbed()
                  this.observer?.unobserve(this.container)
                }
              } catch (error) {
                handleScriptError(error, {
                  scriptName: 'EmbedInstance',
                  operation: 'observerCallback',
                })
              }
            })
          } catch (error) {
            handleScriptError(error, { scriptName: 'EmbedInstance', operation: 'observerEntries' })
          }
        },
        {
          root: document.body,
          rootMargin: '0px 0px 500px 0px',
          threshold: 0.01,
        }
      )

      this.observer.observe(this.container)
    } catch (error) {
      // Fallback: load immediately if observer fails
      handleScriptError(error, context)
      this.loadEmbed()
    }
  }

  private async loadEmbed(): Promise<void> {
    const context = { scriptName: 'EmbedInstance', operation: 'loadEmbed' }
    addScriptBreadcrumb(context)

    try {
      if (this.loaded) return

      this.loaded = true

      if (this.platform === 'github-gist') {
        await this.loadGitHubGistEmbed()
        return
      }

      if (this.platform === 'codepen') {
        this.loadCodePenEmbed()
        return
      }

      try {
        // Check cache first
        const cached = this.getCachedData()
        if (cached) {
          this.renderEmbed(cached)
          return
        }

        // Fetch fresh data
        const oembedData = await this.fetchOEmbed()

        if (oembedData) {
          this.cacheData(oembedData)
          this.renderEmbed(oembedData)
        } else {
          console.error(`Failed to fetch oEmbed data for ${this.platform}`)
        }
      } catch (error) {
        handleScriptError(error, { scriptName: 'EmbedInstance', operation: 'fetchOrRender' })
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private async fetchOEmbed(): Promise<OEmbedResponse | null> {
    const context = { scriptName: 'EmbedInstance', operation: 'fetchOEmbed' }
    addScriptBreadcrumb(context)

    try {
      const endpoint = this.getOEmbedEndpoint()
      if (!endpoint) {
        console.error(`No oEmbed endpoint found for platform: ${this.platform}`)
        return null
      }

      try {
        const response = await fetch(endpoint)
        if (!response.ok) {
          console.error(`oEmbed API error: ${response.status} ${response.statusText}`)
          return null
        }

        const data = (await response.json()) as OEmbedResponse
        return data
      } catch (error) {
        handleScriptError(error, { scriptName: 'EmbedInstance', operation: 'fetchRequest' })
        return null
      }
    } catch (error) {
      handleScriptError(error, context)
      return null
    }
  }

  private getOEmbedEndpoint(): string | null {
    const encodedUrl = encodeURIComponent(this.url)

    switch (this.platform) {
      case 'x':
        return `https://publish.twitter.com/oembed?url=${encodedUrl}`

      case 'bluesky':
        return `https://embed.bsky.app/oembed?url=${encodedUrl}`

      case 'mastodon':
        return this.getMastodonOEmbedEndpoint()

      case 'youtube':
        {
          const { width, height } = this.getYouTubeDimensions()
          const maxwidth = encodeURIComponent(String(width))
          const maxheight = encodeURIComponent(String(height))
          return `https://www.youtube.com/oembed?url=${encodedUrl}&format=json&maxwidth=${maxwidth}&maxheight=${maxheight}`
        }

      case 'github-gist':
        // GitHub Gist doesn't have oEmbed and is loaded via JSONP
        return null

      case 'codepen':
        // CodePen oEmbed is commonly blocked by CORS; load via the official embed script instead
        return null

      case 'linkedin':
        // LinkedIn doesn't use oEmbed, handled separately
        return null

      default:
        return null
    }
  }

  private getMastodonOEmbedEndpoint(): string | null {
    try {
      // Parse the Mastodon URL to extract the instance domain
      // Format: https://mastodon.social/@username/123456789
      const urlObj = safeParseAbsoluteHttpUrl(this.url)
      if (!urlObj) {
        return null
      }

      const instance = urlObj.hostname
      const encodedUrl = encodeURIComponent(this.url)

      return `https://${instance}/api/oembed?url=${encodedUrl}`
    } catch (error) {
      console.error('Failed to parse Mastodon URL:', error)
      return null
    }
  }

  private renderEmbed(data: OEmbedResponse): void {
    const context = { scriptName: 'EmbedInstance', operation: 'renderEmbed' }
    addScriptBreadcrumb(context)

    try {
      const placeholder = assertHasEmbedPlaceholder(this.container)

      // Create a wrapper for the embed HTML
      const wrapper = document.createElement('div')
      wrapper.className = 'embed-content'
      wrapper.innerHTML = data.html

      const iframeFallbackTitle = (data.title ?? '').trim() || 'Embedded content'
      this.ensureIframeTitles(wrapper, iframeFallbackTitle)

      // Replace placeholder with actual embed
      placeholder.replaceWith(wrapper)

      this.removeLoadingStatusNode()
      this.setAriaBusy(false)

      // Execute any scripts in the embed HTML
      this.executeScripts(wrapper)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private getGitHubGistJsonpUrl(): string | null {
    const parsed = safeParseAbsoluteHttpUrl(this.url)
    if (!parsed) return null

    if (!hostMatchesDomain(parsed.hostname, 'gist.github.com')) {
      return null
    }

    // Expected: /:owner/:gistId
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length < 2) {
      return null
    }

    const owner = parts[0]
    const gistId = parts[1]

    return `https://gist.github.com/${owner}/${gistId}.json`
  }

  private async loadGitHubGistEmbed(): Promise<void> {
    const context = { scriptName: 'EmbedInstance', operation: 'loadGitHubGistEmbed' }
    addScriptBreadcrumb(context)

    try {
      const jsonUrl = this.getGitHubGistJsonpUrl()
      if (!jsonUrl) {
        console.warn('GitHub Gist embed blocked: invalid or unsupported URL')
        return
      }

      type GistJsonpResponse = { div?: string; stylesheet?: string }

      const callbackName = `__gistEmbedCb_${Math.random().toString(36).slice(2)}`
      const cleanup = (script: HTMLScriptElement): void => {
        delete (globalThis as unknown as Record<string, unknown>)[callbackName]
        script.remove()
      }

      const payload = await new Promise<GistJsonpResponse>((resolve, reject) => {
        const script = document.createElement('script')
        ;(globalThis as unknown as Record<string, unknown>)[callbackName] = (data: unknown) => {
          cleanup(script)
          resolve(data as GistJsonpResponse)
        }

        const jsonpUrl = `${jsonUrl}?callback=${encodeURIComponent(callbackName)}`
        script.src = jsonpUrl
        script.async = true
        script.onerror = () => {
          cleanup(script)
          reject(new Error(`Failed to load gist JSONP: ${jsonpUrl}`))
        }

        document.head.appendChild(script)
      })

      if (!payload.div) {
        console.error('GitHub Gist JSONP response missing `div`')
        return
      }

      if (payload.stylesheet) {
        const existing = queryStylesheetLinkByHref(payload.stylesheet)
        if (!existing) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = payload.stylesheet
          document.head.appendChild(link)
        }
      }

      const placeholder = assertHasEmbedPlaceholder(this.container)
      const wrapper = document.createElement('div')
      wrapper.className = 'embed-content'
      wrapper.innerHTML = payload.div

      placeholder.replaceWith(wrapper)
      this.removeLoadingStatusNode()
      this.setAriaBusy(false)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private getCodePenMetadata(): { user: string; slugHash: string } | null {
    const parsed = safeParseAbsoluteHttpUrl(this.url)
    if (!parsed) return null

    if (!hostMatchesDomain(parsed.hostname, 'codepen.io')) {
      return null
    }

    // Common formats:
    // - /:user/pen/:hash
    // - /pen/:hash (less common)
    const parts = parsed.pathname.split('/').filter(Boolean)
    const penIndex = parts.indexOf('pen')
    if (penIndex === -1 || penIndex + 1 >= parts.length) return null

    const slugHash = parts[penIndex + 1]
    if (!slugHash) return null
    const user = penIndex > 0 ? parts[penIndex - 1] : ''
    if (!user) return null

    return { user, slugHash }
  }

  private ensureCodePenEmbedScript(): void {
    const src = 'https://cpwebassets.codepen.io/assets/embed/ei.js'
    const alreadyLoaded = hasScriptWithSrc(src)

    if (alreadyLoaded) {
      const maybeEmbedFn = (globalThis as unknown as { __CPEmbed?: () => void }).__CPEmbed
      if (typeof maybeEmbedFn === 'function') {
        maybeEmbedFn()
      }
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    document.head.appendChild(script)
  }

  private loadCodePenEmbed(): void {
    const context = { scriptName: 'EmbedInstance', operation: 'loadCodePenEmbed' }
    addScriptBreadcrumb(context)

    try {
      const meta = this.getCodePenMetadata()
      if (!meta) {
        console.warn('CodePen embed blocked: invalid or unsupported URL')
        return
      }

      const placeholder = assertHasEmbedPlaceholder(this.container)
      const wrapper = document.createElement('div')
      wrapper.className = 'embed-content'

      const height = this.embedHeight && this.embedHeight > 0 ? this.embedHeight : 600

      const p = document.createElement('p')
      p.className = 'codepen'
      p.setAttribute('data-height', String(height))
      p.setAttribute('data-default-tab', 'result')
      p.setAttribute('data-slug-hash', meta.slugHash)
      p.setAttribute('data-user', meta.user)

      // Assistive + fallback text (shown if CodePen script can't run)
      p.textContent = `See the Pen on CodePen.`

      wrapper.appendChild(p)

      placeholder.replaceWith(wrapper)
      this.removeLoadingStatusNode()
      this.setAriaBusy(false)

      this.ensureCodePenEmbedScript()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private executeScripts(container: HTMLElement): void {
    const scripts = queryScripts(container)
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script')

      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value)
      })

      // Copy content
      newScript.textContent = oldScript.textContent

      // Replace old script with new one to execute it
      oldScript.parentNode?.replaceChild(newScript, oldScript)
    })
  }

  private handleLinkedInEmbed(): void {
    const context = { scriptName: 'EmbedInstance', operation: 'handleLinkedInEmbed' }
    addScriptBreadcrumb(context)

    try {
      // LinkedIn embeds are already complete iframes slotted into the component
      // We just need to make them responsive
      const iframe = queryFirstIframe(this.container)
      if (!iframe) {
        console.warn('LinkedIn iframe not found')
        return
      }

      this.ensureIframeTitles(iframe.parentNode ?? this.container, 'Embedded LinkedIn content')

      // Wrap the iframe in a responsive container
      const wrapper = document.createElement('div')
      wrapper.className = 'embed-linkedin-wrapper'
      wrapper.style.position = 'relative'
      wrapper.style.width = '100%'
      wrapper.style.paddingBottom = '117.86%' // 593/504 = 1.1786 aspect ratio
      wrapper.style.maxWidth = '504px'
      wrapper.style.margin = '0 auto'

      // Style the iframe for responsive behavior
      iframe.style.position = 'absolute'
      iframe.style.top = '0'
      iframe.style.left = '0'
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.setAttribute('frameborder', '0')

      // Wrap the iframe
      const parent = iframe.parentNode
      if (parent) {
        parent.insertBefore(wrapper, iframe)
        wrapper.appendChild(iframe)
      }

      this.setAriaBusy(false)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private encodeCacheKeyFragment(value: string): string {
    try {
      const btoaFn = (globalThis as unknown as { btoa?: (_input: string) => string }).btoa
      if (typeof btoaFn !== 'function') {
        return encodeURIComponent(value)
      }

      const TextEncoderCtor = (globalThis as unknown as { TextEncoder?: typeof TextEncoder })
        .TextEncoder
      if (typeof TextEncoderCtor === 'function') {
        const bytes = new TextEncoderCtor().encode(value)
        let binary = ''
        bytes.forEach(b => {
          binary += String.fromCharCode(b)
        })
        return btoaFn(binary)
      }

      // Fallback for older engines without TextEncoder.
      return encodeURIComponent(value)
    } catch {
      return encodeURIComponent(value)
    }
  }

  private getCacheKey(): string {
    const fragment = this.encodeCacheKeyFragment(this.url).substring(0, 50)
    return `${EmbedInstance.CACHE_PREFIX}${this.platform}_${fragment}`
  }

  private getCachedData(): OEmbedResponse | null {
    const cached = getCachedEmbed(this.getCacheKey())
    return cached as OEmbedResponse | null
  }

  private cacheData(data: OEmbedResponse): void {
    const ttl = data.cache_age ? data.cache_age * 1000 : EmbedInstance.DEFAULT_TTL
    cacheEmbed(this.getCacheKey(), data, ttl)
  }

  pause(): void {
    this.paused = true
    // Pause any autoplay media in the embed
    const videos = queryVideos(this.container)
    videos.forEach(video => video.pause())
  }

  resume(): void {
    this.paused = false
  }

  destroy(): void {
    this.observer?.disconnect()
    this.observer = null
  }
}
