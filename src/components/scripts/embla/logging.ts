/**
 * Factory for E2E-only console logging.
 * Logs are emitted only when running under Playwright (`window.isPlaywrightControlled`).
 */
export const createE2ELogger = (prefix: string) => {
  return (
    level: 'info' | 'error',
    message: string,
    details?: Record<string, unknown>
  ): void => {
    if (typeof window === 'undefined' || window.isPlaywrightControlled !== true) return
    const payload = details
      ? [`[${prefix}] ${message}`, details]
      : [`[${prefix}] ${message}`]
    console[level](...payload)
  }
}
