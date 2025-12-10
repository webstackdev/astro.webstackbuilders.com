import type { ImageMetadata } from 'astro'
import defaultAvatar from '@assets/images/avatars/webmention-avatar-default.svg'

type LocalAvatarImageProps = {
  src: ImageMetadata
}

type RemoteAvatarImageProps = {
  src: string
  inferSize: true
}

export type AvatarImageProps = LocalAvatarImageProps | RemoteAvatarImageProps

/**
 * Normalize avatar photo URLs into Image component props with remote size inference support.
 */
export const buildAvatarImageProps = (photo?: string | null): AvatarImageProps => {
  const normalizedPhoto = photo?.trim()
  if (normalizedPhoto?.length) {
    return {
      src: normalizedPhoto,
      inferSize: true,
    }
  }

  return { src: defaultAvatar }
}
