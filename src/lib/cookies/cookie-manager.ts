// Refactored cookie management handlers
// Renamed from openCity to avoid external references

export const showCookieTab = (event: Event, tabName: string) => {
  // Get all elements with class="tabcontent" and hide them
  const tabcontent = document.getElementsByClassName('tabcontent') as HTMLCollectionOf<HTMLElement>
  const tabcontentArray = Array.from(tabcontent);
  tabcontentArray.forEach(element => {
    element.style.display = 'none'
  });

  // Get all elements with class="tablinks" and remove the class "active"
  const tablinks = document.getElementsByClassName('tablinks') as HTMLCollectionOf<HTMLElement>
  const tablinksArray = Array.from(tablinks);
  tablinksArray.forEach(element => {
    element.className = element.className.replace(' active', '')
  });

  // Show the current tab, and add an "active" class to the button that opened the tab
  const currentTab = document.getElementById(tabName)
  if (currentTab) currentTab.style.display = 'block'

  const target = event.currentTarget as HTMLElement
  if (target) target.className += ' active'
}

export const redirectToCookiesPage = () => {
  // Redirect to the new cookies page instead of showing modal
  window.location.href = '/cookies'
}

// Cookie preference management
export class WebstackCookieManager {
  private cookiePrefix = 'webstack-'
  private consentCookie = 'cookie-consent'

  constructor() {
    this.init()
  }

  private init() {
    // Set up event listeners for cookie consent modal
    this.setupConsentHandlers()
  }

  private setupConsentHandlers() {
    // Handle "Allow All" button in consent modal
    const allowAllBtn = document.querySelector('.cookie-modal__btn-allow')
    if (allowAllBtn) {
      allowAllBtn.addEventListener('click', () => this.allowAllCookies())
    }

    // Handle "Customize" link - now redirects to cookies page
    const customizeLink = document.querySelector('.cookie-modal__link-customize')
    if (customizeLink) {
      customizeLink.addEventListener('click', (e) => {
        e.preventDefault()
        window.location.href = '/cookies'
      })
    }

    const customizeBtn = document.querySelector('.cookie-modal__btn-customize')
    if (customizeBtn) {
      customizeBtn.addEventListener('click', (e) => {
        e.preventDefault()
        window.location.href = '/cookies'
      })
    }
  }

  public allowAllCookies() {
    const preferences = {
      necessary: true,
      analytics: true,
      functional: true,
      advertising: true,
      timestamp: new Date().toISOString()
    }

    this.setCookie(this.consentCookie, JSON.stringify(preferences), 365)
    this.applyPreferences(preferences)
    this.hideCookieConsent()
  }

  public saveCustomPreferences(preferences: any) {
    this.setCookie(this.consentCookie, JSON.stringify(preferences), 365)
    this.applyPreferences(preferences)
  }

  public getCookiePreferences() {
    const consent = this.getCookie(this.consentCookie)
    if (consent) {
      try {
        return JSON.parse(consent)
      } catch (e) {
        console.warn('Could not parse cookie preferences')
      }
    }
    return null
  }

  private applyPreferences(preferences: any) {
    // Apply the cookie preferences to actual cookie management
    // This would integrate with your analytics, functional, and advertising scripts

    if (preferences.analytics) {
      // Enable analytics cookies (e.g., Google Analytics)
      this.enableAnalytics()
    } else {
      // Disable analytics cookies
      this.disableAnalytics()
    }

    if (preferences.functional) {
      // Enable functional cookies
      this.enableFunctional()
    } else {
      // Disable functional cookies
      this.disableFunctional()
    }

    if (preferences.advertising) {
      // Enable advertising cookies
      this.enableAdvertising()
    } else {
      // Disable advertising cookies
      this.disableAdvertising()
    }
  }

  private enableAnalytics() {
    // Implement analytics cookie enabling logic
    console.log('Analytics cookies enabled')
    // Example: Load Google Analytics
    // gtag('config', 'GA_MEASUREMENT_ID')
  }

  private disableAnalytics() {
    // Implement analytics cookie disabling logic
    console.log('Analytics cookies disabled')
    // Example: Disable Google Analytics
    // window['ga-disable-GA_MEASUREMENT_ID'] = true
  }

  private enableFunctional() {
    console.log('Functional cookies enabled')
    // Implement functional cookie enabling logic
  }

  private disableFunctional() {
    console.log('Functional cookies disabled')
    // Implement functional cookie disabling logic
  }

  private enableAdvertising() {
    console.log('Advertising cookies enabled')
    // Implement advertising cookie enabling logic
  }

  private disableAdvertising() {
    console.log('Advertising cookies disabled')
    // Implement advertising cookie disabling logic
  }

  private hideCookieConsent() {
    const modal = document.getElementById('cookie-consent-modal')
    if (modal) {
      modal.style.display = 'none'
    }
  }

  private setCookie(name: string, value: string, days: number) {
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
}

// Global instance for easy access
export const cookieManager = new WebstackCookieManager()

// Legacy function name for backward compatibility
export const openCity = showCookieTab