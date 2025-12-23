/**
 * Simple logger for development mode and testing
 * In production, errors are sent to Sentry instead
 */
import { isProd } from '@lib/config/environmentServer'
const shouldLog = !isProd()

export const logger = {
  /**
   * Log an error message
   * In development: Outputs to console with red emoji
   * In production: Silent (errors go to Sentry via errorHandler)
   */
  error(message: string, error?: unknown): void {
    if (shouldLog) {
      console.error(`❌ ${message}`, error || '')
    }
  },

  /**
   * Log a warning message
   * Only outputs in development mode
   */
  warn(message: string, data?: unknown): void {
    if (shouldLog) {
      console.warn(`⚠️ ${message}`, data || '')
    }
  },

  /**
   * Log an info message
   * Only outputs in development mode
   */
  info(message: string, data?: unknown): void {
    if (shouldLog) {
      console.info(`ℹ️ ${message}`, data || '')
    }
  },

  /**
   * Log a debug message
   * Only outputs in development mode
   */
  debug(message: string, data?: unknown): void {
    if (shouldLog) {
      console.debug(`🐛 ${message}`, data || '')
    }
  },

  /**
   * Log a success message
   * Only outputs in development mode
   */
  success(message: string, data?: unknown): void {
    if (shouldLog) {
      console.log(`✅ ${message}`, data || '')
    }
  },
}
