/**
 * Hero Image Column
 */
import type { ImageMetadata } from 'astro'

export interface ImageProps {
  /** Hero image (optional) */
  image?: {
    src: ImageMetadata
    alt: string
  } | undefined
}
