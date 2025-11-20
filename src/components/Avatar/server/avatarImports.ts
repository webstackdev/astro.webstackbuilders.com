import type { ImageMetadata } from 'astro'

export type AvatarModuleMap = Record<string, ImageMetadata>

export const loadAvatarModules = (): AvatarModuleMap =>
  /* eslint-disable-next-line no-restricted-syntax -- rule to forbid import.meta.env is not granular enough to allow .glob */
  import.meta.glob('../../assets/images/avatars/*.{webp,jpg,png}', {
    eager: true,
    import: 'default',
  }) as AvatarModuleMap
