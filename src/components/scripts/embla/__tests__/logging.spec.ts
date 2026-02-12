import { afterEach, describe, expect, it, vi } from 'vitest'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'
import { createE2ELogger } from '../logging'

describe('createE2ELogger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does nothing when window is undefined', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const logger = createE2ELogger('Test')

    logger('info', 'hello')

    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('does not log when Playwright flag is missing', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const logger = createE2ELogger('Test')

    await withJsdomEnvironment(({ window }) => {
      delete (window as Window & { isPlaywrightControlled?: boolean }).isPlaywrightControlled
      logger('info', 'hello')
    })

    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('logs message and details when running under Playwright', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const logger = createE2ELogger('Embla')
    const details = { count: 2 }

    await withJsdomEnvironment(({ window }) => {
      ;(window as Window & { isPlaywrightControlled?: boolean }).isPlaywrightControlled = true
      logger('info', 'ready', details)
    })

    expect(infoSpy).toHaveBeenCalledWith('[Embla] ready', details)
  })

  it('logs error when requested under Playwright', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const logger = createE2ELogger('Embla')

    await withJsdomEnvironment(({ window }) => {
      ;(window as Window & { isPlaywrightControlled?: boolean }).isPlaywrightControlled = true
      logger('error', 'failed')
    })

    expect(errorSpy).toHaveBeenCalledWith('[Embla] failed')
  })
})