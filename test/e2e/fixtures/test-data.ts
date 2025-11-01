/**
 * Shared test data for E2E tests
 * Centralized location for test emails, form values, and other reusable data
 */

export const TEST_EMAILS = {
  valid: 'test@example.com',
  validAlternate: 'test.user+tag@example.co.uk',
  invalid: 'not-an-email',
  invalidMissingAt: 'test.example.com',
  invalidMissingDomain: 'test@',
}

export const TEST_CONTACT_DATA = {
  valid: {
    name: 'John Doe',
    email: TEST_EMAILS.valid,
    company: 'Test Company Inc.',
    phone: '+1-555-0123',
    subject: 'Project Inquiry',
    message: 'I would like to discuss a web development project.',
    budget: '$10,000 - $25,000',
    timeline: '1-3 months',
  },
  minimal: {
    name: 'Jane Smith',
    email: TEST_EMAILS.validAlternate,
    message: 'Quick question about your services.',
  },
}

export const TEST_NEWSLETTER_DATA = {
  valid: {
    email: TEST_EMAILS.valid,
    consentGiven: true,
  },
  withoutConsent: {
    email: TEST_EMAILS.valid,
    consentGiven: false,
  },
}

export const TEST_URLS = {
  home: '/',
  about: '/about',
  articles: '/articles',
  services: '/services',
  caseStudies: '/case-studies',
  contact: '/contact',
  privacy: '/privacy',
  cookies: '/cookies',
  notFound: '/this-page-does-not-exist',
}

export const TEST_TIMEOUTS = {
  short: 1000,
  medium: 3000,
  long: 5000,
  api: 10000,
}

/**
 * Common viewport sizes for responsive testing
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 720 }, // HD Desktop
  wide: { width: 1920, height: 1080 }, // Full HD
}

/**
 * Expected meta tags for SEO validation
 */
export const REQUIRED_META_TAGS = [
  'og:title',
  'og:type',
  'og:url',
  'og:image',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image',
]

/**
 * Common error messages to check for
 */
export const ERROR_MESSAGES = {
  emailRequired: 'Please enter your email address',
  emailInvalid: 'Please enter a valid email address',
  nameRequired: 'Please enter your name',
  messageRequired: 'Please enter a message',
  consentRequired: 'Please consent to receive marketing communications',
  gdprConsentRequired: 'You must consent to data processing',
}

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  newsletterConfirmation: 'Please check your email to confirm your subscription',
  contactFormSent: 'We\'ll get back to you',
  downloadStarted: 'Your download',
}
