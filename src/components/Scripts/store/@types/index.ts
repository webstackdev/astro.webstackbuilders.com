/**
 * Type definitions for state management
 */

export type ConsentCategory = 'necessary' | 'analytics' | 'advertising' | 'functional'
export type ConsentValue = boolean
export type ThemeId = 'default' | 'dark' | 'holiday'

export interface ConsentState {
  necessary: ConsentValue
  analytics: ConsentValue
  advertising: ConsentValue
  functional: ConsentValue
  timestamp?: string
}

export interface EmbedCacheEntry {
  data: unknown
  timestamp: number
  ttl: number
}

export interface EmbedCacheState {
  [key: string]: EmbedCacheEntry
}
