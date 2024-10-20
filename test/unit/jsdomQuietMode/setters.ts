/**
 * Setters to quiet the console output from JSDOM in a custom Jest environment
 */
import type { jest as Jest } from '@jest/globals'

export interface quietModeHandlerParam {
  isQuietMode: boolean | undefined
}
export const setQuietMode = ({ isQuietMode }: quietModeHandlerParam, jest: typeof Jest) => {
  if (isQuietMode) {
    jest.spyOn(console, 'error')
    // @ts-ignore jest.spyOn adds this functionality
    console.error.mockImplementation(() => undefined)
  }
}

export const unsetQuietMode = ({ isQuietMode }: quietModeHandlerParam) => {
  if (isQuietMode) {
    // @ts-ignore jest.spyOn adds this functionality
    console.error.mockRestore()
  }
}
