/**
 * Mock data for ThemePicker component testing
 */

import type { ThemeId } from '@components/scripts/store'

/**
 * Mock themes for testing
 */
export const mockThemes: ThemeId[] = ['light', 'dark', 'holiday']

/**
 * Mock meta colors object
 */
export const mockMetaColors = {
  default: '#ffffff',
  dark: '#000000',
  holiday: '#ff0000',
}
