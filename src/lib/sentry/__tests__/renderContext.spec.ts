import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyRenderSentryContext } from '../renderContext'

const { addBreadcrumbMock, isInitializedMock, setContextMock, setTagsMock } = vi.hoisted(() => ({
  addBreadcrumbMock: vi.fn(),
  isInitializedMock: vi.fn(),
  setContextMock: vi.fn(),
  setTagsMock: vi.fn(),
}))

vi.mock('@sentry/astro', () => ({
  addBreadcrumb: addBreadcrumbMock,
  isInitialized: isInitializedMock,
  setContext: setContextMock,
  setTags: setTagsMock,
}))

describe('applyRenderSentryContext', () => {
  beforeEach(() => {
    addBreadcrumbMock.mockReset()
    isInitializedMock.mockReset()
    setContextMock.mockReset()
    setTagsMock.mockReset()
  })

  it('does nothing when Sentry is not initialized', () => {
    isInitializedMock.mockReturnValue(false)

    applyRenderSentryContext({
      contextName: 'pageRender',
      context: { path: '/contact' },
    })

    expect(setTagsMock).not.toHaveBeenCalled()
    expect(setContextMock).not.toHaveBeenCalled()
    expect(addBreadcrumbMock).not.toHaveBeenCalled()
  })

  it('normalizes tags and context values before sending them to Sentry', () => {
    isInitializedMock.mockReturnValue(true)

    applyRenderSentryContext({
      contextName: 'pageRender',
      breadcrumbMessage: 'render:BaseLayout',
      tags: {
        path: '/privacy',
        hasAstroSite: false,
        breadcrumbCount: 2,
        ignored: undefined,
      },
      context: {
        path: '/privacy',
        requestUrl: new URL('https://www.webstackbuilders.com/privacy'),
        publishDate: new Date('2026-03-23T00:00:00.000Z'),
        breadcrumbLabels: ['Home', 'Privacy'],
        emptyValue: undefined,
      },
    })

    expect(setTagsMock).toHaveBeenCalledWith({
      path: '/privacy',
      hasAstroSite: 'false',
      breadcrumbCount: '2',
    })

    expect(setContextMock).toHaveBeenCalledWith('pageRender', {
      path: '/privacy',
      requestUrl: 'https://www.webstackbuilders.com/privacy',
      publishDate: '2026-03-23T00:00:00.000Z',
      breadcrumbLabels: ['Home', 'Privacy'],
    })

    expect(addBreadcrumbMock).toHaveBeenCalledWith({
      category: 'render',
      level: 'info',
      message: 'render:BaseLayout',
      data: {
        path: '/privacy',
        requestUrl: 'https://www.webstackbuilders.com/privacy',
        publishDate: '2026-03-23T00:00:00.000Z',
        breadcrumbLabels: ['Home', 'Privacy'],
      },
    })
  })
})
