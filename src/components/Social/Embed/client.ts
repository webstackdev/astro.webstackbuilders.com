import { LoadableScript, type TriggerEvent } from '../../Scripts/loader/@types/loader'
import { cacheEmbed, getCachedEmbed } from '@components/Scripts/state'
import { handleScriptError, addScriptBreadcrumb } from '@components/Scripts/errors'

/**
 * Platform types supported by the Embed component
 */
export type EmbedPlatform =
  | 'x'
  | 'linkedin'
  | 'bluesky'
  | 'mastodon'
  | 'reddit'
  | 'youtube'
  | 'github-gist'
  | 'codepen'

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

/**
 * Manager class for all social embeds using singleton pattern
 * Can be registered directly: registerScript(EmbedManager)
 */
export class EmbedManager extends LoadableScript {
  private static instance: EmbedManager | null = null
  private embeds: Map<HTMLElement, EmbedInstance> = new Map()
  private initialized = false

  static override scriptName = 'EmbedManager'
  static override eventType: TriggerEvent = 'delayed'

  static override init(): void {
    const context = { scriptName: EmbedManager.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      const instance = EmbedManager.getInstance()

      if (instance.initialized) {
        instance.discoverNewEmbeds()
        return
      }

      console.log('Initializing EmbedManager...')
      instance.discoverNewEmbeds()
      instance.initialized = true
    } catch (error) {
      // Embeds are optional enhancements
      handleScriptError(error, context)
    }
  }

  static override pause(): void {
    EmbedManager.getInstance().pauseAll()
  }

  static override resume(): void {
    EmbedManager.getInstance().resumeAll()
  }

  private static getInstance(): EmbedManager {
    if (!EmbedManager.instance) {
      EmbedManager.instance = new EmbedManager()
    }
    return EmbedManager.instance
  }

  private constructor() {
    super()
  }

  private discoverNewEmbeds(): void {
    const context = { scriptName: EmbedManager.scriptName, operation: 'discoverEmbeds' }
    addScriptBreadcrumb(context)

    try {
      const embedElements = document.querySelectorAll('[data-embed]:not([data-embed-managed])')

      embedElements.forEach((element, index) => {
        try {
          const htmlElement = element as HTMLElement
          const platform = htmlElement.dataset['embedPlatform'] as EmbedPlatform | undefined
          const url = htmlElement.dataset['embedUrl']

          if (!url) {
            console.warn('Embed element missing data-embed-url attribute')
            return
          }

          const embed = new EmbedInstance(htmlElement, url, platform, this.embeds.size + index)
          embed.initialize()

          this.embeds.set(htmlElement, embed)
          htmlElement.setAttribute('data-embed-managed', 'true')

          console.log(`Embed ${this.embeds.size} initialized for ${platform || 'auto-detected'} platform`)
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
          handleScriptError(error, { scriptName: EmbedManager.scriptName, operation: 'resumeEmbed' })
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
          handleScriptError(error, { scriptName: EmbedManager.scriptName, operation: 'checkStaleEmbed' })
        }
      })

      toRemove.forEach(element => {
        try {
          this.embeds.delete(element)
        } catch (error) {
          handleScriptError(error, { scriptName: EmbedManager.scriptName, operation: 'deleteEmbed' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  static override reset(): void {
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

  // Cache settings
  private static readonly CACHE_PREFIX = 'embed_cache_'
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours

  constructor(container: HTMLElement, url: string, platform: EmbedPlatform | undefined, _instanceId: number) {
    this.container = container
    this.url = url
    this.platform = platform || this.detectPlatform(url)
  }

  initialize(): void {
    const context = { scriptName: 'EmbedInstance', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
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
    const urlLower = url.toLowerCase()

    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
      return 'x'
    }
    if (urlLower.includes('linkedin.com')) {
      return 'linkedin'
    }
    if (urlLower.includes('bsky.app') || urlLower.includes('bsky.social')) {
      return 'bluesky'
    }
    if (urlLower.match(/mastodon\.|\/\@[^\/]+\/\d+/)) {
      return 'mastodon'
    }
    if (urlLower.includes('reddit.com')) {
      return 'reddit'
    }
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube'
    }
    if (urlLower.includes('gist.github.com')) {
      return 'github-gist'
    }
    if (urlLower.includes('codepen.io')) {
      return 'codepen'
    }

    console.warn(`Could not detect platform for URL: ${url}, defaulting to 'x'`)
    return 'x'
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
                handleScriptError(error, { scriptName: 'EmbedInstance', operation: 'observerCallback' })
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

      try {
        // Check cache first
        const cached = this.getCachedData()
        if (cached) {
          console.log(`Loading ${this.platform} embed from cache`)
          this.renderEmbed(cached)
          return
        }

        // Fetch fresh data
        console.log(`Fetching ${this.platform} embed from oEmbed API`)
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

      case 'reddit':
        return `https://www.reddit.com/oembed?url=${encodedUrl}`

      case 'youtube':
        return `https://www.youtube.com/oembed?url=${encodedUrl}&format=json`

      case 'github-gist':
        // GitHub Gist doesn't have official oEmbed, we'll handle this differently
        return null

      case 'codepen':
        return `https://codepen.io/api/oembed?url=${encodedUrl}&format=json`

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
      const urlObj = new URL(this.url)
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
      const placeholder = this.container.querySelector('[data-embed-placeholder]')
      if (!placeholder) {
        console.warn('Placeholder not found in embed container')
        return
      }

      // Create a wrapper for the embed HTML
      const wrapper = document.createElement('div')
      wrapper.className = 'embed-content'
      wrapper.innerHTML = data.html

      // Handle GitHub Gist specially (no oEmbed support)
      if (this.platform === 'github-gist') {
        this.renderGitHubGist(wrapper)
        return
      }

      // Replace placeholder with actual embed
      placeholder.replaceWith(wrapper)

      // Execute any scripts in the embed HTML
      this.executeScripts(wrapper)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private renderGitHubGist(wrapper: HTMLElement): void {
    // For GitHub Gist, we create a script tag that loads the gist
    const script = document.createElement('script')
    script.src = `${this.url}.js`
    wrapper.appendChild(script)

    const placeholder = this.container.querySelector('[data-embed-placeholder]')
    placeholder?.replaceWith(wrapper)
  }

  private executeScripts(container: HTMLElement): void {
    const scripts = container.querySelectorAll('script')
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
      const iframe = this.container.querySelector('iframe')
      if (!iframe) {
        console.warn('LinkedIn iframe not found')
        return
      }

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

      console.log('LinkedIn embed made responsive')
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private getCacheKey(): string {
    return `${EmbedInstance.CACHE_PREFIX}${this.platform}_${btoa(this.url).substring(0, 50)}`
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
    const videos = this.container.querySelectorAll('video')
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
