import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'

export function getOrCreateDataSubjectId(): string {
  // Try localStorage first
  const storedId = localStorage.getItem('DataSubjectId')
  if (storedId && uuidValidate(storedId)) {
    syncToCookie(storedId)
    return storedId
  }

  // Try cookie as backup
  const cookieId = getCookieValue('DataSubjectId')
  if (cookieId && uuidValidate(cookieId)) {
    localStorage.setItem('DataSubjectId', cookieId)
    return cookieId
  }

  // Generate new ID
  const newId = uuidv4()
  localStorage.setItem('DataSubjectId', newId)
  syncToCookie(newId)

  return newId
}

export function deleteDataSubjectId(): void {
  localStorage.removeItem('DataSubjectId')
  document.cookie = 'DataSubjectId=; path=/; max-age=0'
}

function syncToCookie(dataSubjectId: string): void {
  const isProduction = window.location.protocol === 'https:'

  document.cookie = [
    `DataSubjectId=${dataSubjectId}`,
    'path=/',
    'max-age=31536000', // 1 year
    'SameSite=Strict',
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

function getCookieValue(name: string): string | null {
  // For security: only allow safe cookie names (alphanumeric + underscore)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new ClientScriptError({
      message: `Invalid cookie name: ${name}`
    })
  }

  // Use a safe, pre-validated cookie name in regex
  // eslint-disable-next-line security/detect-non-literal-regexp
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}
