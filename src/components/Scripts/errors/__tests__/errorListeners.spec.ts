import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest'
import { PromiseRejectionEvent } from '@lib/@types/PromiseRejectionEvent'
import {
  addUnhandledExceptionEventListeners,
  addUnhandledRejectionEventListeners,
  addErrorEventListeners
} from '../errorListeners'
import { unhandledExceptionHandler, unhandledRejectionHandler } from '../handlers'

// Mock the handlers
vi.mock('../handlers', () => ({
  unhandledExceptionHandler: vi.fn(),
  unhandledRejectionHandler: vi.fn()
}))

const mockedUnhandledExceptionHandler = unhandledExceptionHandler as MockedFunction<typeof unhandledExceptionHandler>
const mockedUnhandledRejectionHandler = unhandledRejectionHandler as MockedFunction<typeof unhandledRejectionHandler>

describe('Error Listeners', () => {
  let originalAddEventListener: typeof window.addEventListener
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAddEventListener: MockedFunction<any>

  beforeEach(() => {
    // Store original and create mock
    originalAddEventListener = window.addEventListener
    mockAddEventListener = vi.fn()
    // Use type assertion to handle complex typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).addEventListener = mockAddEventListener

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original addEventListener
    window.addEventListener = originalAddEventListener
  })

  describe('addUnhandledExceptionEventListeners', () => {
    it('should attach error event listener to window', () => {
      addUnhandledExceptionEventListeners()

      expect(mockAddEventListener).toHaveBeenCalledOnce()
      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should call unhandledExceptionHandler when error event is fired', () => {
      addUnhandledExceptionEventListeners()

      // Get the event handler that was registered
      const errorHandler = mockAddEventListener.mock.calls[0]?.[1] as (_event: ErrorEvent) => void

      // Create a test error event
      const testErrorEvent = new ErrorEvent('error', {
        message: 'Test error message',
        filename: 'test.js',
        lineno: 42,
        colno: 10,
        error: new Error('Test error')
      })

      // Simulate the event being fired
      errorHandler(testErrorEvent)

      expect(mockedUnhandledExceptionHandler).toHaveBeenCalledOnce()
      expect(mockedUnhandledExceptionHandler).toHaveBeenCalledWith(testErrorEvent)
    })

    it('should handle multiple calls without duplicating listeners', () => {
      addUnhandledExceptionEventListeners()
      addUnhandledExceptionEventListeners()

      expect(mockAddEventListener).toHaveBeenCalledTimes(2)
      expect(mockAddEventListener).toHaveBeenNthCalledWith(1, 'error', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenNthCalledWith(2, 'error', expect.any(Function))
    })
  })

  describe('addUnhandledRejectionEventListeners', () => {
    it('should attach unhandledrejection event listener to window', () => {
      addUnhandledRejectionEventListeners()

      expect(mockAddEventListener).toHaveBeenCalledOnce()
      expect(mockAddEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
    })

    it('should call unhandledRejectionHandler when unhandledrejection event is fired', () => {
      addUnhandledRejectionEventListeners()

      // Get the event handler that was registered
      const rejectionHandler = mockAddEventListener.mock.calls[0]?.[1] as (_event: PromiseRejectionEvent) => void

      // Create a test promise rejection event
      const mockPromise: Promise<unknown> = {} as Promise<unknown> // eslint-disable-line @typescript-eslint/consistent-type-assertions
      const testRejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: mockPromise,
        reason: 'Test rejection reason'
      })

      // Simulate the event being fired
      rejectionHandler(testRejectionEvent)

      expect(mockedUnhandledRejectionHandler).toHaveBeenCalledOnce()
      expect(mockedUnhandledRejectionHandler).toHaveBeenCalledWith(testRejectionEvent)
    })

    it('should handle multiple calls without duplicating listeners', () => {
      addUnhandledRejectionEventListeners()
      addUnhandledRejectionEventListeners()

      expect(mockAddEventListener).toHaveBeenCalledTimes(2)
      expect(mockAddEventListener).toHaveBeenNthCalledWith(1, 'unhandledrejection', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenNthCalledWith(2, 'unhandledrejection', expect.any(Function))
    })
  })

  describe('addErrorEventListeners', () => {
    it('should call both addUnhandledExceptionEventListeners and addUnhandledRejectionEventListeners', () => {
      addErrorEventListeners()

      expect(mockAddEventListener).toHaveBeenCalledTimes(2)
      expect(mockAddEventListener).toHaveBeenNthCalledWith(1, 'error', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenNthCalledWith(2, 'unhandledrejection', expect.any(Function))
    })

    it('should set up handlers that can process both types of events', () => {
      addErrorEventListeners()

      // Get both handlers
      const errorHandler = mockAddEventListener.mock.calls[0]?.[1] as (_event: ErrorEvent) => void
      const rejectionHandler = mockAddEventListener.mock.calls[1]?.[1] as (_event: PromiseRejectionEvent) => void

      // Test error handler
      const testErrorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error')
      })
      errorHandler(testErrorEvent)

      // Test rejection handler
      const mockPromise2: Promise<unknown> = {} as Promise<unknown> // eslint-disable-line @typescript-eslint/consistent-type-assertions
      const testRejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: mockPromise2,
        reason: 'Test rejection'
      })
      rejectionHandler(testRejectionEvent)

      expect(mockedUnhandledExceptionHandler).toHaveBeenCalledOnce()
      expect(mockedUnhandledExceptionHandler).toHaveBeenCalledWith(testErrorEvent)
      expect(mockedUnhandledRejectionHandler).toHaveBeenCalledOnce()
      expect(mockedUnhandledRejectionHandler).toHaveBeenCalledWith(testRejectionEvent)
    })
  })

  describe('Integration Tests', () => {
    beforeEach(() => {
      // Use real addEventListener for integration tests to test actual event flow
      window.addEventListener = originalAddEventListener
    })

    it('should handle real unhandled rejection scenarios', () => {
      // Set up listeners with real addEventListener
      addUnhandledRejectionEventListeners()

      // Create the rejection event as it would occur in real scenarios
      const mockPromise: Promise<unknown> = {} as Promise<unknown> // eslint-disable-line @typescript-eslint/consistent-type-assertions
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: mockPromise,
        reason: 'Test unhandled rejection'
      })

      // Dispatch the event using real dispatchEvent
      window.dispatchEvent(rejectionEvent)

      expect(mockedUnhandledRejectionHandler).toHaveBeenCalledWith(rejectionEvent)
    })

    it('should handle real unhandled exception scenarios', () => {
      // Set up listeners with real addEventListener
      addUnhandledExceptionEventListeners()

      // Create an error event as it would occur in real scenarios
      const errorEvent = new ErrorEvent('error', {
        message: 'Test unhandled exception',
        filename: 'test-file.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test unhandled exception')
      })

      // Dispatch the event using real dispatchEvent
      window.dispatchEvent(errorEvent)

      expect(mockedUnhandledExceptionHandler).toHaveBeenCalledWith(errorEvent)
    })

    it('should handle Error object rejections (like fixture errorListeners_2)', () => {
      addUnhandledRejectionEventListeners()

      const errorObject = new Error('Test new error object in unhandled rejection')
      const mockPromise: Promise<unknown> = {} as Promise<unknown> // eslint-disable-line @typescript-eslint/consistent-type-assertions
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: mockPromise,
        reason: errorObject
      })

      window.dispatchEvent(rejectionEvent)

      expect(mockedUnhandledRejectionHandler).toHaveBeenCalledWith(rejectionEvent)
    })

    it('should handle string rejections (like fixture errorListeners_1)', () => {
      addUnhandledRejectionEventListeners()

      const rejectionReason = 'Test unhandled rejection'
      const mockPromise: Promise<unknown> = {} as Promise<unknown> // eslint-disable-line @typescript-eslint/consistent-type-assertions
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: mockPromise,
        reason: rejectionReason
      })

      window.dispatchEvent(rejectionEvent)

      expect(mockedUnhandledRejectionHandler).toHaveBeenCalledWith(rejectionEvent)
    })

    it('should handle thrown exceptions (like fixture errorListeners_3)', () => {
      addUnhandledExceptionEventListeners()

      const thrownError = new Error('Test unhandled exception')
      const errorEvent = new ErrorEvent('error', {
        message: thrownError.message,
        error: thrownError
      })

      window.dispatchEvent(errorEvent)

      expect(mockedUnhandledExceptionHandler).toHaveBeenCalledWith(errorEvent)
    })
  })

  describe('Event Handler Validation', () => {
    it('should register event handlers that are functions', () => {
      addErrorEventListeners()

      const errorHandler = mockAddEventListener.mock.calls[0]?.[1]
      const rejectionHandler = mockAddEventListener.mock.calls[1]?.[1]

      expect(typeof errorHandler).toBe('function')
      expect(typeof rejectionHandler).toBe('function')
    })

    it('should register handlers with correct event types', () => {
      addErrorEventListeners()

      const errorEventType = mockAddEventListener.mock.calls[0]?.[0]
      const rejectionEventType = mockAddEventListener.mock.calls[1]?.[0]

      expect(errorEventType).toBe('error')
      expect(rejectionEventType).toBe('unhandledrejection')
    })
  })
})