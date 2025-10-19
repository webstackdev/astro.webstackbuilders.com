/**
 * Cookie utilities using js-cookie
 * Replaces manual cookie parsing in Scripts/state/utility.ts
 */
import Cookies from 'js-cookie'

export interface CookieOptions {
  expires?: number | Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

/**
 * Get cookie value
 */
export function getCookie(name: string): string | undefined {
  return Cookies.get(name)
}

/**
 * Set cookie value
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const defaults: CookieOptions = {
    expires: 180, // 180 days default
    sameSite: 'strict',
    path: '/',
  }

  Cookies.set(name, value, { ...defaults, ...options })
}

/**
 * Remove cookie
 */
export function removeCookie(name: string): void {
  Cookies.remove(name)
}

/**
 * Get all cookies as object
 */
export function getAllCookies(): { [key: string]: string } {
  return Cookies.get()
}

/**
 * Check if cookie exists
 */
export function hasCookie(name: string): boolean {
  return Cookies.get(name) !== undefined
}
