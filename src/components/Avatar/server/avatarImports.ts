import type { ImageMetadata } from 'astro'

export type AvatarModuleMap = Record<string, ImageMetadata>

export const loadAvatarModules = (): AvatarModuleMap =>
  import.meta.glob('../../assets/images/avatars/*.{webp,jpg,png}', {
    eager: true,
    import: 'default',
  }) as AvatarModuleMap
