/**
 * Helpers for custom Jest environment class
 */
import { LegacyFakeTimers, ModernFakeTimers } from '@jest/fake-timers'
import type { ModuleMocker } from 'jest-mock'
import type { Config } from '@jest/types'
import { isString } from '../../../src/assets/script/utils/assertions'

export const getLegacyFakeTimers = (
  globalObject: typeof globalThis,
  projectConfig: Config.ProjectConfig,
  moduleMocker: ModuleMocker
) => {
  return new LegacyFakeTimers({
    config: projectConfig,
    global: globalObject,
    moduleMocker,
    timerConfig: {
      idToRef: (id: number) => id,
      refToId: (ref: number) => ref,
    },
  })
}

export const getModernFakeTimers = (
  globalObject: typeof globalThis,
  projectConfig: Config.ProjectConfig
) => {
  return new ModernFakeTimers({
    config: projectConfig,
    global: globalObject,
  })
}

// testEnvironmentOptions: Record<string, unknown>
export const getCustomExportConditions = (
  testEnvironmentOptions: Record<string, unknown>
): string[] => {
  if ('customExportConditions' in testEnvironmentOptions) {
    const customExportConditions = testEnvironmentOptions['customExportConditions']
    if (!Array.isArray(customExportConditions) || !customExportConditions.every(isString)) {
      throw new Error('Custom export conditions specified but they are not an array of strings')
    }
    return customExportConditions
  } else {
    return ['browser']
  }
}
