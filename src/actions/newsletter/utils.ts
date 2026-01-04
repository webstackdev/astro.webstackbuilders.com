import emailValidator from 'email-validator'
import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'

export function validateEmail(email: string): string {
  if (!email) {
    throw new ActionsFunctionError('Email address is required.', { status: 400 })
  }

  if (email.length > 254) {
    throw new ActionsFunctionError('Email address is too long', { status: 400 })
  }

  if (!emailValidator.validate(email)) {
    throw new ActionsFunctionError('Email address is invalid', { status: 400 })
  }

  return email.trim().toLowerCase()
}

export function generateConfirmationToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Buffer.from(array)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
