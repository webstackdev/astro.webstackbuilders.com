/**
 * Cookie Preferences Management
 * Handles the interactive cookie preference functionality for the cookies page
 */

export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  functional: boolean
  advertising: boolean
  timestamp: string
}

export class CookiePreferencesManager {
  private cookiePrefix = 'webstack-'
  private consentCookie = 'cookie-consent'

  constructor() {
    this.init()
  }

  init(): void {
    // Load current preferences
    this.loadPreferences()

    // Set up event listeners
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    const allowAllBtn = document.getElementById('cookie-allow-all')
    const saveBtn = document.getElementById('cookie-save-preferences')

    if (allowAllBtn) {
      allowAllBtn.addEventListener('click', () => this.allowAll())
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.savePreferences())
    }
  }

  loadPreferences(): CookiePreferences | null {
    const consent = this.getCookie(this.consentCookie)
    if (consent) {
      try {
        const preferences = JSON.parse(consent) as CookiePreferences

        // Update checkboxes to match saved preferences
        this.updateCheckboxes(preferences)

        return preferences
      } catch (e) {
        console.warn('Could not parse cookie preferences:', e)
      }
    }
    return null
  }

  private updateCheckboxes(preferences: CookiePreferences): void {
    const analyticsCheckbox = document.getElementById('analytics-cookies') as HTMLInputElement
    const functionalCheckbox = document.getElementById('functional-cookies') as HTMLInputElement
    const advertisingCheckbox = document.getElementById('advertising-cookies') as HTMLInputElement

    if (analyticsCheckbox) analyticsCheckbox.checked = preferences.analytics || false
    if (functionalCheckbox) functionalCheckbox.checked = preferences.functional || false
    if (advertisingCheckbox) advertisingCheckbox.checked = preferences.advertising || false
  }

  savePreferences(): void {
    const preferences = this.getCurrentPreferences()

    this.setCookie(this.consentCookie, JSON.stringify(preferences), 365)
    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('Cookie preferences saved successfully!')
  }

  allowAll(): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      advertising: true,
      timestamp: new Date().toISOString()
    }

    // Update checkboxes
    this.updateCheckboxes(preferences)

    this.setCookie(this.consentCookie, JSON.stringify(preferences), 365)
    this.applyPreferences(preferences)

    // Show confirmation
    this.showNotification('All cookies enabled!')
  }

  private getCurrentPreferences(): CookiePreferences {
    const analyticsCheckbox = document.getElementById('analytics-cookies') as HTMLInputElement
    const functionalCheckbox = document.getElementById('functional-cookies') as HTMLInputElement
    const advertisingCheckbox = document.getElementById('advertising-cookies') as HTMLInputElement

    return {
      necessary: true, // Always true
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
      functional: functionalCheckbox ? functionalCheckbox.checked : false,
      advertising: advertisingCheckbox ? advertisingCheckbox.checked : false,
      timestamp: new Date().toISOString()
    }
  }

  applyPreferences(preferences: CookiePreferences): void {
    // Apply the cookie preferences to actual cookie management
    // This would integrate with your analytics, functional, and advertising scripts

    if (preferences.analytics) {
      // Enable analytics cookies (e.g., Google Analytics)
      console.log('Analytics cookies enabled')
      this.enableAnalytics()
    } else {
      // Disable analytics cookies
      console.log('Analytics cookies disabled')
      this.disableAnalytics()
    }

    if (preferences.functional) {
      // Enable functional cookies
      console.log('Functional cookies enabled')
      this.enableFunctional()
    } else {
      // Disable functional cookies
      console.log('Functional cookies disabled')
      this.disableFunctional()
    }

    if (preferences.advertising) {
      // Enable advertising cookies
      console.log('Advertising cookies enabled')
      this.enableAdvertising()
    } else {
      // Disable advertising cookies
      console.log('Advertising cookies disabled')
      this.disableAdvertising()
    }
  }

  private enableAnalytics(): void {
    // Implement analytics cookie enabling logic
    // Example: Load Google Analytics
    // gtag('config', 'GA_MEASUREMENT_ID')
  }

  private disableAnalytics(): void {
    // Implement analytics cookie disabling logic
    // Example: Disable Google Analytics
    // window['ga-disable-GA_MEASUREMENT_ID'] = true
  }

  private enableFunctional(): void {
    // Implement functional cookie enabling logic
    // Example: Enable theme preferences, language settings, etc.
  }

  private disableFunctional(): void {
    // Implement functional cookie disabling logic
  }

  private enableAdvertising(): void {
    // Implement advertising cookie enabling logic
    // Example: Load advertising tracking scripts
  }

  private disableAdvertising(): void {
    // Implement advertising cookie disabling logic
    // Example: Clear advertising cookies
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date()
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
    document.cookie = `${this.cookiePrefix}${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
  }

  private getCookie(name: string): string | null {
    const nameEQ = `${this.cookiePrefix}${name}=`
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      if (c) {
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
      }
    }
    return null
  }

  showNotification(message: string): void {
    // Create a simple notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300'
    notification.textContent = message

    document.body.appendChild(notification)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateY(-20px)'
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }
}

// Initialize cookie manager when DOM is loaded
export const initializeCookiePreferences = (): void => {
  document.addEventListener('DOMContentLoaded', () => {
    new CookiePreferencesManager()
  })
}

// Default export for easy importing
export default CookiePreferencesManager