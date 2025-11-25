import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { HeroLoader } from '@components/Hero/Home/client'
import { gsap } from 'gsap'

// Setup function for DOM with hero SVG
const setupHeroDOM = () => {
  const svgPath = resolve(__dirname, '../../../assets/images/site/hero.svg')
  const svgContent = readFileSync(svgPath, 'utf8')
  document.body.innerHTML = `
    <div id="heroAnimation" class="hero-container">
      ${svgContent}
    </div>
  `
}

vi.mock('gsap', () => ({
  gsap: {
    set: vi.fn().mockReturnValue({}),
    timeline: vi.fn(() => ({
      timeScale: vi.fn().mockReturnValue({}),
      from: vi.fn().mockReturnValue({}),
      to: vi.fn().mockReturnValue({}),
      staggerFrom: vi.fn().mockReturnValue({}),
      set: vi.fn().mockReturnValue({}),
      pause: vi.fn(),
      play: vi.fn(),
      restart: vi.fn(),
    })),
  },
}))

describe('HeroLoader', () => {
  let gsapMock: any
  let timelineMock: any

  beforeEach(() => {
    vi.clearAllMocks()
    gsapMock = gsap
    timelineMock = {
      timeScale: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      staggerFrom: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      pause: vi.fn(),
      play: vi.fn(),
      restart: vi.fn(),
    }
    gsapMock.timeline.mockReturnValue(timelineMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clears the HeroLoader singleton instance setup by 'new HeroLoader()' in init() calls via static property access
    ;(HeroLoader as any).instance = null
  })

  describe('HeroLoader instantiation and initialization', () => {
    it('should create instance and set properties', () => {
      const loader = new HeroLoader()
      expect(loader).toBeInstanceOf(HeroLoader)
    })

    it('should start animation when init is called', () => {
      setupHeroDOM()
      HeroLoader.init()
      expect(gsapMock.set).toHaveBeenCalled()
      expect(gsapMock.timeline).toHaveBeenCalled()
    })

    it('should not start animation if heroAnimation element missing', () => {
      HeroLoader.init()
      expect(gsapMock.set).not.toHaveBeenCalled()
      expect(gsapMock.timeline).not.toHaveBeenCalled()
    })
  })

  describe('Animation setup', () => {
    beforeEach(() => {
      setupHeroDOM()
    })

    it('should set transform origins correctly', () => {
      HeroLoader.init()
      expect(gsapMock.set).toHaveBeenCalledWith(
        '.monitorBottom',
        expect.objectContaining({
          transformOrigin: '50% 100%',
        })
      )
      expect(gsapMock.set).toHaveBeenCalledWith(
        ['.monitorStand', '.laptopBase', '.tabletScreen'],
        expect.objectContaining({
          transformOrigin: '50% 0%',
        })
      )
    })

    it('should create timeline with correct configuration', () => {
      HeroLoader.init()
      expect(gsapMock.timeline).toHaveBeenCalledWith({
        defaults: { duration: 1 },
        delay: 1,
        paused: false,
        repeat: -1,
        yoyo: false,
      })
      expect(timelineMock.timeScale).toHaveBeenCalledWith(3)
    })

    it('should include monitor animation sequence', () => {
      HeroLoader.init()
      expect(timelineMock.from).toHaveBeenCalledWith(
        '.monitorBottom',
        expect.objectContaining({
          scaleY: 0,
          ease: 'power1',
        })
      )
    })

    it('should use staggered animations for content groups', () => {
      HeroLoader.init()
      expect(timelineMock.from).toHaveBeenCalledWith(
        '.monitorContentGroup path',
        expect.objectContaining({
          duration: 1,
          scaleX: 0,
          stagger: 0.1,
        })
      )
    })
  })

  describe('Pause, Resume, and Reset functionality', () => {
    beforeEach(() => {
      setupHeroDOM()
      HeroLoader.init()
    })

    it('should pause timeline', () => {
      HeroLoader.pause()
      expect(timelineMock.pause).toHaveBeenCalled()
    })

    it('should resume timeline', () => {
      HeroLoader.pause()
      HeroLoader.resume()
      expect(timelineMock.play).toHaveBeenCalled()
    })

    it('should reset timeline', () => {
      HeroLoader.reset()
      expect(timelineMock.restart).toHaveBeenCalled()
    })
  })

  describe('Instance management', () => {
    it('should not duplicate timeline on multiple init calls', () => {
      setupHeroDOM()
      HeroLoader.init()
      const callCount = gsapMock.timeline.mock.calls.length
      HeroLoader.init()
      expect(gsapMock.timeline).toHaveBeenCalledTimes(callCount)
    })
  })

  describe('Error handling', () => {
    it('should handle missing GSAP gracefully', () => {
      vi.doMock('gsap', () => ({ gsap: null }))
      expect(() => HeroLoader.init()).not.toThrow()
    })

    it('should handle malformed DOM', () => {
      document.body.innerHTML = '<div>Malformed</div>'
      expect(() => HeroLoader.init()).not.toThrow()
    })
  })
})
