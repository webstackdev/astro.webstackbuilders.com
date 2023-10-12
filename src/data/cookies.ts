/**
 * This is the categories of cookies used on the website for the cookie consent
 * manager to use in informing users and offering opt-out:
 * - 'essential-website-cookies' Cannot be opted out of and are necessary for
 *                               the site to function.
 * - 'performance-and-functionality-cookies' Search widget, weather update, etc.
 * - 'analytics-and-customization-cookies' Google Analytics, theme cookie
 */
const cookies = {
  'essential-website-cookies': [
    {
      name: '__cfduid',
      purpose:
        'Cookie associated with sites using CloudFlare, used to speed up page load times. According to CloudFlare it is used to override any security restrictions based on the IP address the visitor is coming from. It does not contain any user identification information.',
      provider: 'onetrust.com',
      service: 'CloudFlare',
      'service-privacy-policy-url': 'https://www.freshworks.com/privacy/',
      country: 'United States',
      type: 'http-cookie',
      'expires-in': 'A few seconds',
    },
  ],
  'performance-and-functionality-cookies': [],
  'analytics-and-customization-cookies': [],
}

export default cookies
