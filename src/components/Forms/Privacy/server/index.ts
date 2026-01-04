export const statusMessages: Record<string, { type: 'success' | 'error' | 'info'; message: string }> = {
  sent: {
    type: 'success',
    message:
      'Verification email sent! Please check your inbox and click the link to complete your request.',
  },
  invalid: {
    type: 'error',
    message: 'Invalid or expired verification link. Please submit a new request.',
  },
  expired: {
    type: 'error',
    message: 'This verification link has expired. Please submit a new request.',
  },
  'already-completed': { type: 'info', message: 'This request has already been completed.' },
  deleted: {
    type: 'success',
    message: 'Your data has been successfully deleted from our systems.',
  },
  error: { type: 'error', message: 'An error occurred. Please try again or contact support.' },
}
