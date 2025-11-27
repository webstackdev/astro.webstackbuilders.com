/**
 * NetworkStatus component
 * Monitors online/offline status and displays notifications
 */
export class NetworkStatus {
  static scriptName = 'NetworkStatus'

  private static instance: NetworkStatus | null = null
  private hideTimeout: ReturnType<typeof setTimeout> | null = null

  constructor() {
  }

  bindEvents() {
    // Listen for online event
    window.addEventListener('online', this.handleOnline)

    // Listen for offline event
    window.addEventListener('offline', this.handleOffline)

    // Initial status check
    this.updateConnectionStatus()
  }

  /**
   * Handle online event - show success notification
   */
  handleOnline = () => {
    this.showNotification('Connection restored!', 'success')
    this.updateConnectionStatus()
  }

  /**
   * Handle offline event - update status indicator
   */
  handleOffline = () => {
    this.updateConnectionStatus()
  }

  /**
   * Update connection status indicator if it exists
   */
  updateConnectionStatus = () => {
    const isOnline = navigator.onLine
    const statusIndicator = document.querySelector('.connection-status')

    if (statusIndicator) {
      statusIndicator.textContent = isOnline ? 'Online' : 'Offline'
      statusIndicator.className = `connection-status ${isOnline ? 'text-green-600' : 'text-red-600'}`
    }
  }

  /**
   * Show a toast notification
   */
  showNotification(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.getElementById('network-status-toast')
    const messageElement = toast?.querySelector('.toast-message')

    if (!toast || !messageElement) {
      return
    }

    // Clear any existing timeout to prevent premature hiding
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }

    // Set message and type
    messageElement.textContent = message
    toast.setAttribute('data-type', type)

    // Show the toast
    toast.classList.remove('hidden')

    // Auto-hide notification after 3 seconds
    this.hideTimeout = setTimeout(() => {
      toast.classList.add('hidden')
      this.hideTimeout = null
    }, 3000)
  }

  pause() {
    // Remove event listeners when script is paused
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }

  resume() {
    // Re-add event listeners when script is resumed
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  /**
   * LoadableScript static methods
   */
  static init(): void {
    NetworkStatus.instance = new NetworkStatus()
    NetworkStatus.instance.bindEvents()
  }

  static pause(): void {
    if (NetworkStatus.instance) {
      NetworkStatus.instance.pause()
    }
  }

  static resume(): void {
    if (NetworkStatus.instance) {
      NetworkStatus.instance.resume()
    }
  }

  static reset(): void {
    if (NetworkStatus.instance) {
      NetworkStatus.instance.pause()
      NetworkStatus.instance = null
    }
  }
}
