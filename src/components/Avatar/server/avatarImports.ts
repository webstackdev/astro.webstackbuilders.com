/**
 * Kept in a separate file to facilitate mocking in tests
 */
import type { AvatarMap } from './@types'

export const loadAvatarModules = (): AvatarMap =>
  import.meta.glob('@assets/images/avatars/*.{webp,jpg,png}', {
    eager: true,
    import: 'default',
  }) as AvatarMap
