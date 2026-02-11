import { afterEach, describe, expect, it, vi } from 'vitest'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import type { EmblaCarouselType } from 'embla-carousel'

const addButtonEventListenersMock = vi.hoisted(() => vi.fn())
const handleScriptErrorMock = vi.hoisted(() => vi.fn())

vi.mock('@components/scripts/elementListeners', () => ({
  addButtonEventListeners: addButtonEventListenersMock,
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: handleScriptErrorMock,
}))

import { createEmblaNavStateUpdater, setupEmblaNavButtons } from '../navigation'

interface EmblaApiMock {
  canScrollPrev: ReturnType<typeof vi.fn>
  canScrollNext: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  scrollPrev: ReturnType<typeof vi.fn>
  scrollNext: ReturnType<typeof vi.fn>
  __setCanScrollPrev: (_value: boolean) => void
  __setCanScrollNext: (_value: boolean) => void
  __trigger: (_event: 'select' | 'reInit') => void
}

/** Create a mock Embla API with mutable state and event handlers. */
const createEmblaApiMock = (options: { canScrollPrev: boolean; canScrollNext: boolean }): EmblaApiMock => {
  let canScrollPrevValue = options.canScrollPrev
  let canScrollNextValue = options.canScrollNext
  const handlers = new Map<'select' | 'reInit', () => void>()

  return {
    canScrollPrev: vi.fn(() => canScrollPrevValue),
    canScrollNext: vi.fn(() => canScrollNextValue),
    on: vi.fn((event: 'select' | 'reInit', handler: () => void) => {
      handlers.set(event, handler)
      return undefined as unknown as EmblaCarouselType
    }),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    __setCanScrollPrev: (value: boolean) => {
      canScrollPrevValue = value
    },
    __setCanScrollNext: (value: boolean) => {
      canScrollNextValue = value
    },
    __trigger: (event: 'select' | 'reInit') => {
      handlers.get(event)?.()
    },
  } as EmblaApiMock
}

/** Create button elements for navigation tests. */
const createButtons = (window: Window) => ({
  prevBtn: window.document.createElement('button'),
  nextBtn: window.document.createElement('button'),
})

describe('createEmblaNavStateUpdater', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates button disabled state and responds to Embla events', async () => {
    await withJsdomEnvironment(({ window }) => {
      const emblaApi = createEmblaApiMock({ canScrollPrev: false, canScrollNext: true })
      const { prevBtn, nextBtn } = createButtons(window)

      createEmblaNavStateUpdater(emblaApi as unknown as EmblaCarouselType, prevBtn, nextBtn)

      expect(prevBtn.getAttribute('disabled')).toBe('true')
      expect(nextBtn.hasAttribute('disabled')).toBe(false)

      emblaApi.__setCanScrollPrev(true)
      emblaApi.__setCanScrollNext(false)
      emblaApi.__trigger('select')

      expect(prevBtn.hasAttribute('disabled')).toBe(false)
      expect(nextBtn.getAttribute('disabled')).toBe('true')

      expect(emblaApi.on).toHaveBeenCalledWith('select', expect.any(Function))
      expect(emblaApi.on).toHaveBeenCalledWith('reInit', expect.any(Function))
    })
  })
})

describe('setupEmblaNavButtons', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('wires click handlers and updates disabled state', async () => {
    await withJsdomEnvironment(({ window }) => {
      const emblaApi = createEmblaApiMock({ canScrollPrev: true, canScrollNext: true })
      const { prevBtn, nextBtn } = createButtons(window)
      const listenerContext = { id: 'theme-picker' }

      let prevHandler: (() => void) | undefined
      let nextHandler: (() => void) | undefined

      addButtonEventListenersMock.mockImplementation((button, handler, context) => {
        if (button === prevBtn) prevHandler = handler as () => void
        if (button === nextBtn) nextHandler = handler as () => void
        expect(context).toBe(listenerContext)
      })

      const handle = setupEmblaNavButtons(
        emblaApi as unknown as EmblaCarouselType,
        prevBtn,
        nextBtn,
        { scriptName: 'ThemePicker' },
        listenerContext
      )

      expect(prevHandler).toBeDefined()
      expect(nextHandler).toBeDefined()

      prevHandler?.()
      nextHandler?.()

      expect(emblaApi.scrollPrev).toHaveBeenCalled()
      expect(emblaApi.scrollNext).toHaveBeenCalled()

      emblaApi.__setCanScrollPrev(false)
      emblaApi.__setCanScrollNext(false)
      handle.update()

      expect(prevBtn.getAttribute('disabled')).toBe('true')
      expect(nextBtn.getAttribute('disabled')).toBe('true')
    })
  })

  it('reports errors from scroll handlers', async () => {
    await withJsdomEnvironment(({ window }) => {
      const emblaApi = createEmblaApiMock({ canScrollPrev: true, canScrollNext: true })
      const { prevBtn, nextBtn } = createButtons(window)

      emblaApi.scrollPrev.mockImplementation(() => {
        throw new Error('prev failed')
      })

      emblaApi.scrollNext.mockImplementation(() => {
        throw new Error('next failed')
      })

      let prevHandler: (() => void) | undefined
      let nextHandler: (() => void) | undefined

      addButtonEventListenersMock.mockImplementation((button, handler) => {
        if (button === prevBtn) prevHandler = handler as () => void
        if (button === nextBtn) nextHandler = handler as () => void
      })

      setupEmblaNavButtons(emblaApi as unknown as EmblaCarouselType, prevBtn, nextBtn, {
        scriptName: 'ThemePicker',
      })

      prevHandler?.()
      nextHandler?.()

      expect(handleScriptErrorMock).toHaveBeenCalledWith(expect.any(Error), {
        scriptName: 'ThemePicker',
        operation: 'scrollPrev',
      })
      expect(handleScriptErrorMock).toHaveBeenCalledWith(expect.any(Error), {
        scriptName: 'ThemePicker',
        operation: 'scrollNext',
      })
    })
  })
})