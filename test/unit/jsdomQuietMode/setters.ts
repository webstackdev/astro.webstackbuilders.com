/**
 * Setters to quiet the console output from JSDOM in a custom Vitest environment
 */
import { type vi as Vi } from "vitest"

export interface quietModeHandlerParam {
  isQuietMode: boolean | undefined
}
export const setQuietMode = ({ isQuietMode }: quietModeHandlerParam, vi: typeof Vi) => {
  if (isQuietMode) {
    vi.spyOn(console, 'error')
    // @ts-ignore vi.spyOn adds this functionality
    console.error.mockImplementation(() => undefined)
  }
}

export const unsetQuietMode = ({ isQuietMode }: quietModeHandlerParam) => {
  if (isQuietMode) {
    // @ts-ignore vi.spyOn adds this functionality
    console.error.mockRestore()
  }
}
