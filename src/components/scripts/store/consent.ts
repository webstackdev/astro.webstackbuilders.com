/**
 * Cookie Consent State Management
 */
import { actions } from 'astro:actions'
import { computed, onMount } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { StoreController } from '@nanostores/lit'
import type { ReactiveControllerHost } from 'lit'
import { validate as uuidValidate } from 'uuid'
import type { ConsentPurpose, ConsentRequest, ConsentSource } from '@actions/gdpr/@types'
import { getCookie, removeCookie, setCookie } from '@components/scripts/utils/cookies'
import { ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { $isConsentBannerVisible } from '@components/scripts/store/consentBanner'
import {
  getOrCreateDataSubjectId,
  deleteDataSubjectId,
} from '@components/scripts/utils/dataSubjectId'

// ============================================================================
// TYPES
// ============================================================================

export type ConsentCategory = 'analytics' | 'marketing' | 'functional'
export type ConsentCategories = ConsentCategory
export type ConsentValue = boolean
export type ConsentPreference = 'granted' | 'refused' | 'unknown'

export interface ConsentState {
  analytics: ConsentValue
  marketing: ConsentValue
  functional: ConsentValue
  DataSubjectId: string
}

const consentCookieCategories: ConsentCategories[] = ['analytics', 'marketing', 'functional']
const CONSENT_COOKIE_PREFIX = 'consent_'
const CONSENT_LOG_DEBOUNCE_MS = 250
const CONSENT_LOG_MAX_RETRY_DELAY_MS = 30_000

type ConsentActionError = {
  code?: string
  message?: string
  status?: number
  statusText?: string
  cause?: unknown
}

const createConsentActionError = (params: {
  code?: string | undefined
  message?: string | undefined
  status?: number | undefined
  statusText?: string | undefined
  cause?: unknown
}): ConsentActionError => {
  const actionError: ConsentActionError = {}

  if (params.code !== undefined) actionError.code = params.code
  if (params.message !== undefined) actionError.message = params.message
  if (params.status !== undefined) actionError.status = params.status
  if (params.statusText !== undefined) actionError.statusText = params.statusText
  if (params.cause !== undefined) actionError.cause = params.cause

  return actionError
}

class ConsentLogRetryableError extends Error {
  readonly retryAfterMs: number

  constructor(message: string, retryAfterMs: number, cause?: unknown) {
    super(message, { cause })
    this.name = 'ConsentLogRetryableError'
    this.retryAfterMs = retryAfterMs
  }
}

const prefixConsentCookie = (category: ConsentCategories): string =>
  `${CONSENT_COOKIE_PREFIX}${category}`

const createDefaultConsentState = (): ConsentState => ({
  analytics: false,
  marketing: false,
  functional: false,
  DataSubjectId: '',
})

const persistConsentStateSafely = (state: ConsentState): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem('cookieConsent', JSON.stringify(state))
  } catch {
    // Ignore persistence failures (Safari private mode, etc.)
  }
}

const isConsentState = (value: unknown): value is ConsentState => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ConsentState>
  const hasValidBooleans =
    typeof candidate.analytics === 'boolean' &&
    typeof candidate.marketing === 'boolean' &&
    typeof candidate.functional === 'boolean'

  if (!hasValidBooleans) {
    return false
  }

  return (
    typeof candidate.DataSubjectId === 'string' || typeof candidate.DataSubjectId === 'undefined'
  )
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Consent preferences
 * Persisted to localStorage automatically via nanostores/persistent
 * Also synced with cookies for GDPR compliance
 *
 * Note: 'functional' defaults to false (opt-in model) as it stores personal data
 * (Mastodon instance preferences which can identify users). Theme and social cache
 * are classified as 'necessary' and handled separately without requiring consent.
 */
// @TODO: $consent.get() - should subscribe instead
export const $consent = persistentAtom<ConsentState>('cookieConsent', createDefaultConsentState(), {
  encode: JSON.stringify,
  decode: (value: string): ConsentState => {
    try {
      const parsedValue = JSON.parse(value)
      if (isConsentState(parsedValue)) {
        return {
          analytics: parsedValue.analytics,
          marketing: parsedValue.marketing,
          functional: parsedValue.functional,
          DataSubjectId: parsedValue.DataSubjectId ?? '',
        }
      }
    } catch {
      // Ignore JSON parsing errors - we will fall back to defaults
    }

    const defaultState = createDefaultConsentState()
    persistConsentStateSafely(defaultState)
    return defaultState
  },
})

// Initialize DataSubjectId on store mount
onMount($consent, () => {
  const currentState = $consent.get()
  if (!currentState.DataSubjectId) {
    $consent.set({
      ...currentState,
      DataSubjectId: getOrCreateDataSubjectId(),
    })
  }
})

// ============================================================================
// COMPUTED STORES
// ============================================================================

/**
 * Check if specific consent category is granted
 */
export const $hasAnalyticsConsent = computed($consent, consent => consent.analytics)
export const $hasFunctionalConsent = computed($consent, consent => consent.functional)
export const $hasMarketingConsent = computed($consent, consent => consent.marketing)

/**
 * Check if any consent is granted
 */
export const $hasAnyConsent = computed($consent, consent => {
  return consent.analytics || consent.functional || consent.marketing
})

// ============================================================================
// COOKIE HELPERS
// ============================================================================

/**
 * Read a consent cookie value, ensuring defaults exist before access
 */
export function getConsentCookie(category: ConsentCategories): string | undefined {
  const analyticsCookie = getCookie(prefixConsentCookie('analytics'))
  if (typeof analyticsCookie === 'undefined') {
    initConsentCookies()
  }

  return getCookie(prefixConsentCookie(category))
}

/**
 * Persist consent through the centralized state updates
 */
export function setConsentCookie(
  category: ConsentCategories,
  preference: ConsentPreference = 'granted'
): void {
  const granted = preference === 'granted'
  updateConsent(category, granted)
}

/**
 * Initialize consent cookies with opt-out defaults
 */
export function initConsentCookies(): boolean {
  return ensureConsentCookiesInitialized()
}

/**
 * Grant all consent categories (used by consent banner primary CTA)
 */
export function allowAllConsentCookies(): void {
  allowAllConsent()
}

/**
 * Remove persisted consent cookies without mutating store state
 */
export function removeConsentCookies(): void {
  consentCookieCategories.forEach(category => {
    removeCookie(prefixConsentCookie(category))
  })
}

// ============================================================================
// SUBSCRIPTION HELPERS
// ============================================================================

export type ConsentSubscription = (_hasConsent: boolean) => void

/**
 * Read the current functional consent preference
 */
export function getFunctionalConsentPreference(): boolean {
  return $hasFunctionalConsent.get()
}

export function getAnalyticsConsentPreference(): boolean {
  return $hasAnalyticsConsent.get()
}

/**
 * Subscribe to functional consent changes with immediate synchronization
 */
export function subscribeToFunctionalConsent(listener: ConsentSubscription): () => void {
  const unsubscribe = $hasFunctionalConsent.listen(listener)
  listener($hasFunctionalConsent.get())
  return unsubscribe
}

// ============================================================================
// ACTIONS
// ============================================================================

export type ConsentStateListener = (_consent: ConsentState) => void

export function getConsentSnapshot(): ConsentState {
  return $consent.get()
}

export function subscribeToConsentState(listener: ConsentStateListener): () => void {
  return $consent.listen(listener)
}

const ensureConsentDataSubjectId = (state: ConsentState): string => {
  if (state.DataSubjectId && uuidValidate(state.DataSubjectId)) {
    return state.DataSubjectId
  }

  const regeneratedId = getOrCreateDataSubjectId()

  if (state.DataSubjectId !== regeneratedId) {
    $consent.set({
      ...state,
      DataSubjectId: regeneratedId,
    })
  }

  return regeneratedId
}

/**
 * Update consent for specific category
 * Automatically updates both store AND cookie
 */
export function updateConsent(category: ConsentCategory, value: ConsentValue): void {
  try {
    // Get current state
    const currentConsent = $consent.get()

    // Update store with new value
    $consent.set({
      ...currentConsent,
      [category]: value,
    })

    // Update cookie
    const cookieName = `consent_${category}`
    setCookie(cookieName, value.toString(), { expires: 365, sameSite: 'strict' })
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'cookieConsent',
      operation: 'updateConsent',
    })
  }
}

/**
 * Grant all consent categories
 */
export function allowAllConsent(): void {
  const categories: ConsentCategory[] = ['analytics', 'marketing', 'functional']
  categories.forEach(category => updateConsent(category, true))
}

/**
 * Revoke all consent
 */
export function revokeAllConsent(): void {
  updateConsent('analytics', false)
  updateConsent('marketing', false)
  updateConsent('functional', false)
}

/**
 * Ensure consent cookies exist with explicit opt-out defaults
 * Returns true when cookies were initialized during this call
 */
export function ensureConsentCookiesInitialized(): boolean {
  const analyticsCookie = getCookie('consent_analytics')

  if (typeof analyticsCookie === 'undefined') {
    updateConsent('analytics', false)
    updateConsent('marketing', false)
    updateConsent('functional', false)
    return true
  }

  return false
}

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Initialize consent state from cookies on page load
 * Called once during app initialization from bootstrap
 */
export function initConsentFromCookies(): void {
  try {
    const currentState = $consent.get()
    const consent: ConsentState = {
      analytics: getCookie('consent_analytics') === 'true',
      marketing: getCookie('consent_marketing') === 'true',
      functional: getCookie('consent_functional') === 'true',
      DataSubjectId: currentState.DataSubjectId || getOrCreateDataSubjectId(),
    }

    $consent.set(consent)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'cookieConsent',
      operation: 'initConsentFromCookies',
    })
    // Set safe defaults if cookie reading fails
    $consent.set({
      analytics: false,
      marketing: false,
      functional: false,
      DataSubjectId: getOrCreateDataSubjectId(),
    })
  }
}

export function initConsentSideEffects(): void {
  // Side Effect 1: Show/hide cookie modal
  $isConsentBannerVisible.subscribe(visible => {
    try {
      const modal = document.getElementById('consent-modal-id')
      if (modal) {
        modal.style.display = visible ? 'flex' : 'none'
      }
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'modalVisibility',
      })
    }
  })

  // Side Effect 2: Log consent changes to API
  const consentLoggingContext = {
    scriptName: 'cookieConsent',
    operation: 'logConsentToAPI',
  } as const
  type ConsentLogPayload = Pick<ConsentRequest, 'DataSubjectId' | 'purposes' | 'source' | 'userAgent' | 'verified'>
  let queuedConsentLogPayload: ConsentLogPayload | null = null
  let hasConsentLoggingFailure = false
  let isConsentLogProcessing = false
  let onlineListener: (() => void) | null = null
  let consentLogTimerId: number | null = null

  const isNavigatorOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false

  const clearConsentLogTimer = () => {
    if (consentLogTimerId === null || typeof window === 'undefined') {
      return
    }

    window.clearTimeout(consentLogTimerId)
    consentLogTimerId = null
  }

  const scheduleConsentLogProcessing = (delayMs: number) => {
    if (typeof window === 'undefined') {
      void processConsentLogQueue()
      return
    }

    clearConsentLogTimer()
    consentLogTimerId = window.setTimeout(() => {
      consentLogTimerId = null
      void processConsentLogQueue()
    }, delayMs)
  }

  const parseRetryAfterMs = (response?: Response, serverMessage?: string): number => {
    const retryAfterHeader = response?.headers.get('Retry-After')
    if (retryAfterHeader) {
      const retryAfterSeconds = Number(retryAfterHeader)
      if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return Math.min(retryAfterSeconds * 1000, CONSENT_LOG_MAX_RETRY_DELAY_MS)
      }

      const retryAfterDate = Date.parse(retryAfterHeader)
      if (!Number.isNaN(retryAfterDate)) {
        return Math.min(Math.max(0, retryAfterDate - Date.now()), CONSENT_LOG_MAX_RETRY_DELAY_MS)
      }
    }

    const retryMatch = serverMessage?.match(/try again in\s+(\d+)s/i)
    if (retryMatch) {
      const retryAfterSeconds = Number(retryMatch[1])
      if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return Math.min(retryAfterSeconds * 1000, CONSENT_LOG_MAX_RETRY_DELAY_MS)
      }
    }

    return 5_000
  }

  const parseStatusCode = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value)
      if (Number.isFinite(parsedValue)) {
        return parsedValue
      }
    }

    return undefined
  }

  const getErrorRecord = (value: unknown): Record<string, unknown> | undefined => {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined
  }

  const parseStatusCodeFromMessage = (message?: string): number | undefined => {
    const match = message?.match(/status code:\s*(\d{3})/i)
    if (!match?.[1]) {
      return undefined
    }

    return parseStatusCode(match[1])
  }

  const normalizeConsentActionError = (value: unknown): ConsentActionError | undefined => {
    if (!value) {
      return undefined
    }

    if (typeof value === 'string') {
      return createConsentActionError({
        message: value,
        status: parseStatusCodeFromMessage(value),
        cause: value,
      })
    }

    const errorRecord = getErrorRecord(value)
    if (!errorRecord) {
      return createConsentActionError({
        message: String(value),
        cause: value,
      })
    }

    const causeRecord = getErrorRecord(errorRecord['cause'])
    const message =
      typeof errorRecord['message'] === 'string'
        ? errorRecord['message']
        : typeof causeRecord?.['message'] === 'string'
          ? causeRecord['message']
          : undefined

    return createConsentActionError({
      code: typeof errorRecord['code'] === 'string' ? errorRecord['code'] : undefined,
      message,
      status:
        parseStatusCode(errorRecord['status']) ??
        parseStatusCode(errorRecord['statusCode']) ??
        parseStatusCode(causeRecord?.['status']) ??
        parseStatusCode(causeRecord?.['statusCode']) ??
        parseStatusCodeFromMessage(message),
      statusText:
        typeof errorRecord['statusText'] === 'string'
          ? errorRecord['statusText']
          : typeof causeRecord?.['statusText'] === 'string'
            ? causeRecord['statusText']
            : undefined,
      cause: value,
    })
  }

  const isSecurityCheckpointError = (error?: ConsentActionError): boolean => {
    if (typeof error?.message !== 'string') {
      return false
    }

    const normalizedMessage = error.message.toLowerCase()
    const hasCheckpointMarkup =
      normalizedMessage.includes('vercel security checkpoint') ||
      (normalizedMessage.includes('<!doctype html') && normalizedMessage.includes('security checkpoint'))

    return hasCheckpointMarkup
  }

  const ensureOnlineListener = () => {
    if (typeof window === 'undefined' || onlineListener) {
      return
    }

    onlineListener = () => {
      if (onlineListener && typeof window !== 'undefined') {
        window.removeEventListener('online', onlineListener)
        onlineListener = null
      }
      void processConsentLogQueue()
    }

    window.addEventListener('online', onlineListener)
  }

  const processConsentLogQueue = async (): Promise<void> => {
    if (hasConsentLoggingFailure || isConsentLogProcessing) {
      return
    }

    if (!isNavigatorOnline()) {
      ensureOnlineListener()
      return
    }

    isConsentLogProcessing = true

    try {
      while (queuedConsentLogPayload) {
        const payload = queuedConsentLogPayload
        queuedConsentLogPayload = null

        try {
          await sendConsentPayload(payload)
        } catch (error) {
          if (!isNavigatorOnline()) {
            queuedConsentLogPayload ??= payload
            ensureOnlineListener()
            break
          }

          if (error instanceof ConsentLogRetryableError) {
            queuedConsentLogPayload ??= payload
            scheduleConsentLogProcessing(error.retryAfterMs)
            break
          }

          hasConsentLoggingFailure = true
          handleScriptError(error, consentLoggingContext)
          break
        }
      }
    } finally {
      isConsentLogProcessing = false

      if (!queuedConsentLogPayload && onlineListener && typeof window !== 'undefined') {
        window.removeEventListener('online', onlineListener)
        onlineListener = null
      }
    }
  }

  const enqueueConsentPayload = (payload: ConsentLogPayload) => {
    queuedConsentLogPayload = payload
    scheduleConsentLogProcessing(CONSENT_LOG_DEBOUNCE_MS)
  }

  const sendConsentPayload = async (payload: ConsentLogPayload) => {
    let actionResponse: Awaited<ReturnType<typeof actions.gdpr.consentCreate>> | undefined
    let thrownActionError: unknown

    try {
      actionResponse = await actions.gdpr.consentCreate(payload)
    } catch (error) {
      thrownActionError = error
    }

    const data = actionResponse?.data
    const error = actionResponse?.error

    if (!error && data?.success) {
      return
    }

    const actionError = normalizeConsentActionError(error ?? thrownActionError)

    const serverMessage =
      typeof actionError?.message === 'string' && actionError.message.trim().length > 0
        ? actionError.message
        : undefined

    if (actionError?.code === 'TOO_MANY_REQUESTS' || actionError?.status === 429) {
      throw new ConsentLogRetryableError(
        serverMessage ?? 'Consent logging is temporarily rate limited',
        parseRetryAfterMs(undefined, serverMessage),
        {
          code: actionError.code,
          status: actionError.status,
          statusText: actionError.statusText,
        }
      )
    }

    if (isSecurityCheckpointError(actionError)) {
      // Consent logging is best-effort. If Vercel blocks the action behind a
      // checkpoint page, disable further attempts for this session without
      // surfacing user-invisible noise to Sentry.
      hasConsentLoggingFailure = true
      return
    }

    throw new ClientScriptError({
      message: serverMessage ?? 'Failed to record consent',
      cause: {
        code: actionError?.code,
        status: actionError?.status,
        statusText: actionError?.statusText,
      },
    })
  }

  $consent.subscribe((consentState, oldConsentState) => {
    if (!oldConsentState || hasConsentLoggingFailure) {
      return
    }

    const categoriesChanged = ['analytics', 'marketing', 'functional'].some(
      category =>
        consentState[category as ConsentCategory] !== oldConsentState[category as ConsentCategory]
    )

    if (!categoriesChanged) {
      return
    }

    const purposes: ConsentPurpose[] = []
    if (consentState.analytics) purposes.push('analytics')
    if (consentState.marketing) purposes.push('marketing')
    if (consentState.functional) purposes.push('functional')

    const userAgent =
      typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string'
        ? navigator.userAgent
        : 'unknown'

    const dataSubjectId = ensureConsentDataSubjectId(consentState)

    enqueueConsentPayload({
      DataSubjectId: dataSubjectId,
      purposes,
      source: 'cookies_modal' as ConsentSource,
      userAgent,
      verified: false,
    })
  })

  // Side Effect 3: Delete DataSubjectId when functional consent is revoked
  $hasFunctionalConsent.subscribe(hasConsent => {
    if (!hasConsent) {
      try {
        deleteDataSubjectId()
      } catch (error) {
        handleScriptError(error, {
          scriptName: 'cookieConsent',
          operation: 'deleteDataSubjectId',
        })
      }
    }
  })

  // Side Effect 4: Update Sentry context when analytics consent changes
  $hasAnalyticsConsent.subscribe(hasConsent => {
    try {
      // Dynamically import to avoid circular dependencies and allow lazy loading
      import('@components/scripts/sentry/helpers')
        .then(({ updateConsentContext }) => {
          updateConsentContext(hasConsent)
        })
        .catch(error => {
          // Sentry may not be initialized in all environments
          console.warn('Failed to update Sentry consent context:', error)
        })
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'updateSentryConsent',
      })
    }
  })
}

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Create a reactive StoreController for $consent
 * For use in Lit components - automatically triggers re-render when consent state changes
 */
export function createConsentController(
  host: ReactiveControllerHost
): StoreController<ConsentState> {
  return new StoreController(host, $consent)
}

/**
 * Create a reactive StoreController for $hasAnalyticsConsent
 * For use in Lit components - automatically triggers re-render when analytics consent changes
 */
export function createAnalyticsConsentController(
  host: ReactiveControllerHost
): StoreController<boolean> {
  return new StoreController(host, $hasAnalyticsConsent)
}

/**
 * Create a reactive StoreController for $hasFunctionalConsent
 * For use in Lit components - automatically triggers re-render when functional consent changes
 */
export function createFunctionalConsentController(
  host: ReactiveControllerHost
): StoreController<boolean> {
  return new StoreController(host, $hasFunctionalConsent)
}

/**
 * Create a reactive StoreController for $hasMarketingConsent
 * For use in Lit components - automatically triggers re-render when marketing consent changes
 */
export function createMarketingConsentController(
  host: ReactiveControllerHost
): StoreController<boolean> {
  return new StoreController(host, $hasMarketingConsent)
}

/**
 * Create a reactive StoreController for $hasAnyConsent
 * For use in Lit components - automatically triggers re-render when any consent changes
 */
export function createAnyConsentController(host: ReactiveControllerHost): StoreController<boolean> {
  return new StoreController(host, $hasAnyConsent)
}
