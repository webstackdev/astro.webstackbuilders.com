// @vitest-environment happy-dom
/**
 * Tests for NetworkStatus component using LoadableScript pattern
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { NetworkStatus } from '../client'

describe('NetworkStatus LoadableScript', () => {
  let networkStatus: NetworkStatus

  beforeEach(() => {
    // Set up DOM with toast notification
    document.body.innerHTML = `
      <div
        id="network-status-toast"
        class="hidden"
        data-type="success"
      >
        <span class="toast-message">Connection restored!</span>
      </div>
      <div class="connection-status">Online</div>
    `

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })

    // Use fake timers for setTimeout
    vi.useFakeTimers()

    networkStatus = new NetworkStatus()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('LoadableScript Implementation', () => {
    test('should have correct scriptName', () => {
      expect(NetworkStatus.scriptName).toBe('NetworkStatus')
    })

    test('should have correct eventType', () => {
      expect(NetworkStatus.eventType).toBe('astro:page-load')
    })

    test('should initialize without errors', () => {
      expect(() => new NetworkStatus()).not.toThrow()
    })

    test('init() should call bindEvents', () => {
      const bindEventsSpy = vi.spyOn(NetworkStatus.prototype, 'bindEvents')
      NetworkStatus.init()
      expect(bindEventsSpy).toHaveBeenCalled()
    })
  })

  describe('bindEvents', () => {
    test('should add online event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      networkStatus.bindEvents()

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', networkStatus.handleOnline)
    })

    test('should add offline event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      networkStatus.bindEvents()

      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', networkStatus.handleOffline)
    })

    test('should call updateConnectionStatus on initialization', () => {
      const updateStatusSpy = vi.spyOn(networkStatus, 'updateConnectionStatus')
      networkStatus.bindEvents()

      expect(updateStatusSpy).toHaveBeenCalled()
    })
  })

  describe('handleOnline', () => {
    test('should show success notification', () => {
      const showNotificationSpy = vi.spyOn(networkStatus, 'showNotification')
      networkStatus.handleOnline()

      expect(showNotificationSpy).toHaveBeenCalledWith('Connection restored!', 'success')
    })

    test('should update connection status', () => {
      const updateStatusSpy = vi.spyOn(networkStatus, 'updateConnectionStatus')
      networkStatus.handleOnline()

      expect(updateStatusSpy).toHaveBeenCalled()
    })
  })

  describe('handleOffline', () => {
    test('should update connection status', () => {
      const updateStatusSpy = vi.spyOn(networkStatus, 'updateConnectionStatus')
      networkStatus.handleOffline()

      expect(updateStatusSpy).toHaveBeenCalled()
    })

    test('should not show notification', () => {
      const showNotificationSpy = vi.spyOn(networkStatus, 'showNotification')
      networkStatus.handleOffline()

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })
  })

  describe('updateConnectionStatus', () => {
    test('should update status indicator when online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
      const statusIndicator = document.querySelector('.connection-status')

      networkStatus.updateConnectionStatus()

      expect(statusIndicator?.textContent).toBe('Online')
      expect(statusIndicator?.className).toContain('text-green-600')
    })

    test('should update status indicator when offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
      const statusIndicator = document.querySelector('.connection-status')

      networkStatus.updateConnectionStatus()

      expect(statusIndicator?.textContent).toBe('Offline')
      expect(statusIndicator?.className).toContain('text-red-600')
    })

    test('should handle missing status indicator gracefully', () => {
      document.body.innerHTML = '<div id="network-status-toast"></div>'

      expect(() => networkStatus.updateConnectionStatus()).not.toThrow()
    })

    test('should preserve connection-status class', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
      const statusIndicator = document.querySelector('.connection-status')

      networkStatus.updateConnectionStatus()

      expect(statusIndicator?.className).toContain('connection-status')
    })
  })

  describe('showNotification', () => {
    test('should show success notification with correct styling', () => {
      const toast = document.getElementById('network-status-toast')
      const messageElement = toast?.querySelector('.toast-message')

      networkStatus.showNotification('Test success', 'success')

      expect(messageElement?.textContent).toBe('Test success')
      expect(toast?.getAttribute('data-type')).toBe('success')
      expect(toast?.classList.contains('hidden')).toBe(false)
    })

    test('should show error notification with correct styling', () => {
      const toast = document.getElementById('network-status-toast')
      const messageElement = toast?.querySelector('.toast-message')

      networkStatus.showNotification('Test error', 'error')

      expect(messageElement?.textContent).toBe('Test error')
      expect(toast?.getAttribute('data-type')).toBe('error')
      expect(toast?.classList.contains('hidden')).toBe(false)
    })

    test('should hide notification after 3 seconds', () => {
      const toast = document.getElementById('network-status-toast')

      networkStatus.showNotification('Test message', 'success')
      expect(toast?.classList.contains('hidden')).toBe(false)

      vi.advanceTimersByTime(3000)
      expect(toast?.classList.contains('hidden')).toBe(true)
    })

    test('should handle missing toast element gracefully', () => {
      document.body.innerHTML = '<div class="connection-status"></div>'

      expect(() => networkStatus.showNotification('Test', 'success')).not.toThrow()
    })

    test('should handle missing message element gracefully', () => {
      document.body.innerHTML = '<div id="network-status-toast"></div>'

      expect(() => networkStatus.showNotification('Test', 'success')).not.toThrow()
    })

    test('should default to success type when not specified', () => {
      const toast = document.getElementById('network-status-toast')

      networkStatus.showNotification('Test message')

      expect(toast?.getAttribute('data-type')).toBe('success')
    })
  })

  describe('pause', () => {
    test('should remove online event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      networkStatus.bindEvents()
      networkStatus.pause()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', networkStatus.handleOnline)
    })

    test('should remove offline event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      networkStatus.bindEvents()
      networkStatus.pause()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', networkStatus.handleOffline)
    })
  })

  describe('resume', () => {
    test('should re-add online event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      networkStatus.resume()

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', networkStatus.handleOnline)
    })

    test('should re-add offline event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      networkStatus.resume()

      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', networkStatus.handleOffline)
    })
  })

  describe('Integration Tests', () => {
    test('should handle online/offline cycle', () => {
      networkStatus.bindEvents()
      const toast = document.getElementById('network-status-toast')

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
      window.dispatchEvent(new Event('offline'))

      const statusIndicator = document.querySelector('.connection-status')
      expect(statusIndicator?.textContent).toBe('Offline')

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
      window.dispatchEvent(new Event('online'))

      expect(statusIndicator?.textContent).toBe('Online')
      expect(toast?.classList.contains('hidden')).toBe(false)
    })

    test('should handle multiple notifications', () => {
      const toast = document.getElementById('network-status-toast')

      networkStatus.showNotification('First message', 'success')
      expect(toast?.querySelector('.toast-message')?.textContent).toBe('First message')

      networkStatus.showNotification('Second message', 'error')
      expect(toast?.querySelector('.toast-message')?.textContent).toBe('Second message')
      expect(toast?.getAttribute('data-type')).toBe('error')
    })

    test('should clean up properly after pause', () => {
      const addListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeListenerSpy = vi.spyOn(window, 'removeEventListener')

      networkStatus.bindEvents()
      expect(addListenerSpy).toHaveBeenCalledTimes(2) // online and offline

      networkStatus.pause()
      expect(removeListenerSpy).toHaveBeenCalledTimes(2)

      // Events should not trigger handlers after pause
      const showNotificationSpy = vi.spyOn(networkStatus, 'showNotification')
      window.dispatchEvent(new Event('online'))
      expect(showNotificationSpy).not.toHaveBeenCalled()
    })

    test('should work correctly after resume', () => {
      networkStatus.bindEvents()
      networkStatus.pause()
      networkStatus.resume()

      const showNotificationSpy = vi.spyOn(networkStatus, 'showNotification')
      window.dispatchEvent(new Event('online'))

      expect(showNotificationSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('should handle missing DOM elements on initialization', () => {
      document.body.innerHTML = ''
      const instance = new NetworkStatus()

      expect(() => instance.bindEvents()).not.toThrow()
    })

    test('should handle rapid online/offline changes', () => {
      networkStatus.bindEvents()

      // Rapidly toggle connection status
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
        window.dispatchEvent(new Event('offline'))
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
        window.dispatchEvent(new Event('online'))
      }

      // Should not throw and should show last status
      const statusIndicator = document.querySelector('.connection-status')
      expect(statusIndicator?.textContent).toBe('Online')
    })

    test('should handle notification timeout overlap', () => {
      const toast = document.getElementById('network-status-toast')

      networkStatus.showNotification('First', 'success')
      vi.advanceTimersByTime(1500) // 1.5 seconds

      networkStatus.showNotification('Second', 'error')
      vi.advanceTimersByTime(1500) // Another 1.5 seconds (3s total)

      // First notification timeout should have fired
      expect(toast?.classList.contains('hidden')).toBe(false)

      vi.advanceTimersByTime(1500) // 4.5 seconds total

      // Second notification timeout should have fired
      expect(toast?.classList.contains('hidden')).toBe(true)
    })
  })
})
