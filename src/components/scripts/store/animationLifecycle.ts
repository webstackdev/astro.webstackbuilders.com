import { map } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import type { ScriptErrorContext } from '@components/scripts/errors/handler'

export type AnimationId = string
export type AnimationPlayState = 'playing' | 'paused'

export interface AnimationControllerConfig {
  animationId: AnimationId
  instanceId?: string
  defaultState?: AnimationPlayState
  debugLabel?: string
  onPlay: () => void
  onPause: () => void
}

export interface AnimationControllerHandle {
  requestPlay: () => void
  requestPause: () => void
  clearUserPreference: () => void
  destroy: () => void
}

interface AnimationPreferencesState {
  [animationId: AnimationId]: AnimationPlayState
}

interface AnimationLifecycleState {
  blockingSources: string[]
  suggestedSources: string[]
  reducedMotionPreferred: boolean
  initialized: boolean
}

interface RegisteredController {
  key: string
  animationId: AnimationId
  debugLabel?: string
  defaultState: AnimationPlayState
  currentState: AnimationPlayState
  play: () => void
  pause: () => void
}

const REDUCED_MOTION_SOURCE = 'reduced-motion'
const DOCUMENT_HIDDEN_SOURCE = 'document-hidden'
const PAGEHIDE_SOURCE = 'pagehide'
const STORAGE_KEY = 'animation-preferences'

const blockingPauseSources = new Set<string>()
const suggestedPauseSources = new Set<string>()
const controllerRegistry = new Map<string, RegisteredController>()

let controllerInstanceCounter = 0
let lifecycleInitialized = false

let reducedMotionMediaQuery: MediaQueryList | undefined
let reducedMotionListener: ((_event: MediaQueryListEvent) => void) | undefined
let visibilityChangeListener: (() => void) | undefined
let pageHideListener: (() => void) | undefined
let pageShowListener: (() => void) | undefined
let astroPageLoadListener: (() => void) | undefined

/*
 * Persisted animation preferences survive page transitions and reloads.
 * This allows users to pause on one page and keep that preference globally.
 */
export const $animationPreferences = persistentAtom<AnimationPreferencesState>(
  STORAGE_KEY,
  {},
  {
    encode: JSON.stringify,
    decode: value => {
      try {
        return JSON.parse(value) as AnimationPreferencesState
      } catch {
        return {}
      }
    },
  }
)

/*
 * Runtime lifecycle store that surfaces system-level pause information for debugging
 * and potential subscriptions.
 */
const initialLifecycleState: AnimationLifecycleState = {
  blockingSources: [],
  suggestedSources: [],
  reducedMotionPreferred: false,
  initialized: false,
}

export const $animationLifecycle = map<AnimationLifecycleState>(initialLifecycleState)

$animationPreferences.listen(() => {
  updateAllControllers()
})

function getInstanceKey(animationId: AnimationId, instanceId?: string): string {
  if (instanceId) return `${animationId}:${instanceId}`
  controllerInstanceCounter += 1
  return `${animationId}:instance-${controllerInstanceCounter}`
}

function updateLifecycleStore(): void {
  $animationLifecycle.set({
    blockingSources: Array.from(blockingPauseSources),
    suggestedSources: Array.from(suggestedPauseSources),
    reducedMotionPreferred: suggestedPauseSources.has(REDUCED_MOTION_SOURCE),
    initialized: lifecycleInitialized,
  })
}

function shouldPauseController(controller: RegisteredController): boolean {
  if (blockingPauseSources.size > 0) {
    return true
  }

  const preference = getAnimationPreference(controller.animationId)
  if (preference === 'paused') {
    return true
  }

  if (preference === 'playing') {
    return false
  }

  if (suggestedPauseSources.size > 0) {
    return true
  }

  return controller.defaultState === 'paused'
}

function safelyInvoke(callback: () => void, context: ScriptErrorContext): void {
  try {
    callback()
  } catch (error) {
    handleScriptError(error, context)
  }
}

function applyControllerState(controller: RegisteredController): void {
  const shouldPause = shouldPauseController(controller)
  const context: ScriptErrorContext = {
    scriptName: controller.debugLabel ?? controller.animationId,
    operation: shouldPause ? 'animationPause' : 'animationPlay',
  }

  if (shouldPause && controller.currentState !== 'paused') {
    safelyInvoke(controller.pause, context)
    controller.currentState = 'paused'
    return
  }

  if (!shouldPause && controller.currentState !== 'playing') {
    safelyInvoke(controller.play, context)
    controller.currentState = 'playing'
  }
}

function updateAllControllers(): void {
  controllerRegistry.forEach(controller => {
    applyControllerState(controller)
  })
}

function updateBlockingSource(source: string, active: boolean): void {
  const hasSource = blockingPauseSources.has(source)
  if (active && !hasSource) {
    blockingPauseSources.add(source)
  } else if (!active && hasSource) {
    blockingPauseSources.delete(source)
  } else {
    return
  }

  updateLifecycleStore()
  updateAllControllers()
}

function updateSuggestedSource(source: string, active: boolean): void {
  const hasSource = suggestedPauseSources.has(source)
  if (active && !hasSource) {
    suggestedPauseSources.add(source)
  } else if (!active && hasSource) {
    suggestedPauseSources.delete(source)
  } else {
    return
  }

  updateLifecycleStore()
  updateAllControllers()
}

function setupReducedMotionListener(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  if (reducedMotionListener) return

  reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  const applyPreference = (matches: boolean) => {
    updateSuggestedSource(REDUCED_MOTION_SOURCE, matches)
  }

  reducedMotionListener = (event: MediaQueryListEvent) => {
    applyPreference(event.matches)
  }

  reducedMotionMediaQuery.addEventListener('change', reducedMotionListener)
  applyPreference(reducedMotionMediaQuery.matches)
}

function setupVisibilityListeners(): void {
  if (typeof document === 'undefined') return
  if (visibilityChangeListener) return

  visibilityChangeListener = () => {
    updateBlockingSource(DOCUMENT_HIDDEN_SOURCE, document.hidden)
  }

  document.addEventListener('visibilitychange', visibilityChangeListener)
  visibilityChangeListener()

  if (typeof window !== 'undefined') {
    if (!pageHideListener) {
      pageHideListener = () => {
        updateBlockingSource(PAGEHIDE_SOURCE, true)
      }
      window.addEventListener('pagehide', pageHideListener)
    }

    if (!pageShowListener) {
      pageShowListener = () => {
        updateBlockingSource(PAGEHIDE_SOURCE, false)
      }
      window.addEventListener('pageshow', pageShowListener)
    }
  }
}

function setupAstroNavigationListener(): void {
  if (typeof document === 'undefined') return
  if (astroPageLoadListener) return

  astroPageLoadListener = () => {
    updateAllControllers()
  }

  document.addEventListener('astro:page-load', astroPageLoadListener)
}

function cleanupListeners(): void {
  if (reducedMotionMediaQuery && reducedMotionListener) {
    reducedMotionMediaQuery.removeEventListener('change', reducedMotionListener)
  }

  if (typeof document !== 'undefined' && visibilityChangeListener) {
    document.removeEventListener('visibilitychange', visibilityChangeListener)
  }

  if (typeof window !== 'undefined') {
    if (pageHideListener) {
      window.removeEventListener('pagehide', pageHideListener)
    }

    if (pageShowListener) {
      window.removeEventListener('pageshow', pageShowListener)
    }
  }

  if (typeof document !== 'undefined' && astroPageLoadListener) {
    document.removeEventListener('astro:page-load', astroPageLoadListener)
  }

  reducedMotionMediaQuery = undefined
  reducedMotionListener = undefined
  visibilityChangeListener = undefined
  pageHideListener = undefined
  pageShowListener = undefined
  astroPageLoadListener = undefined
}

/**
 * Initialize animation lifecycle listeners once per client session
 */
export function initAnimationLifecycle(): void {
  if (lifecycleInitialized) return
  if (typeof window === 'undefined') return

  lifecycleInitialized = true
  addScriptBreadcrumb({ scriptName: 'animationLifecycle', operation: 'init' })

  setupReducedMotionListener()
  setupVisibilityListeners()
  setupAstroNavigationListener()
  updateLifecycleStore()
}

/**
 * Track overlay states (navigation menu, dialogs, etc.) that should pause animations.
 */
export function setOverlayPauseState(source: string, isPaused: boolean): void {
  const overlaySource = `overlay:${source}`
  updateBlockingSource(overlaySource, isPaused)
}

/**
 * Persist an explicit user preference for a given animation id.
 */
export function setAnimationPreference(animationId: AnimationId, state: AnimationPlayState): void {
  const current = $animationPreferences.get()
  if (current[animationId] === state) return

  $animationPreferences.set({
    ...current,
    [animationId]: state,
  })
}

/**
 * Remove any stored preference for an animation id.
 */
export function clearAnimationPreference(animationId: AnimationId): void {
  const current = $animationPreferences.get()
  if (!(animationId in current)) return

  const { [animationId]: _removed, ...rest } = current
  $animationPreferences.set(rest)
}

/**
 * Retrieve the persisted preference for an animation id, if present.
 */
export function getAnimationPreference(animationId: AnimationId): AnimationPlayState | undefined {
  return $animationPreferences.get()[animationId]
}

/**
 * Register a controller that can respond to global animation lifecycle changes.
 */
export function createAnimationController(
  config: AnimationControllerConfig
): AnimationControllerHandle {
  initAnimationLifecycle()

  const key = getInstanceKey(config.animationId, config.instanceId)
  const controller: RegisteredController = {
    key,
    animationId: config.animationId,
    defaultState: config.defaultState ?? 'playing',
    currentState: 'paused',
    play: config.onPlay,
    pause: config.onPause,
    ...(config.debugLabel ? { debugLabel: config.debugLabel } : {}),
  }

  controllerRegistry.set(key, controller)
  applyControllerState(controller)

  return {
    requestPlay: () => {
      setAnimationPreference(config.animationId, 'playing')
      updateAllControllers()
    },
    requestPause: () => {
      setAnimationPreference(config.animationId, 'paused')
      updateAllControllers()
    },
    clearUserPreference: () => {
      clearAnimationPreference(config.animationId)
      updateAllControllers()
    },
    destroy: () => {
      controllerRegistry.delete(key)
    },
  }
}

/**
 * Test helper to completely reset module state between unit tests.
 * Do not use in production code.
 */
export function __resetAnimationLifecycleForTests(): void {
  cleanupListeners()
  blockingPauseSources.clear()
  suggestedPauseSources.clear()
  controllerRegistry.clear()
  controllerInstanceCounter = 0
  lifecycleInitialized = false
  reducedMotionMediaQuery = undefined
  $animationPreferences.set({})
  $animationLifecycle.set(initialLifecycleState)
}
