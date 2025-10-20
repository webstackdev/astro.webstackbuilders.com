// Vercel API function for newsletter signup - Entry point
import handler from './newsletter'

// Export the default handler for Vercel Functions
export default handler

// Export utility functions for use elsewhere
export { subscribeToConvertKit } from './newsletter'
export { createPendingSubscription, confirmSubscription, validateToken } from './token'
export { sendConfirmationEmail, sendWelcomeEmail } from './email'
