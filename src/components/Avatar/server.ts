/**
 * Avatar Manager - Singleton class for managing avatar images
 *
 * Dynamically imports all avatar images from the avatars directory and provides
 * utilities for accessing them by filename. The singleton pattern ensures that
 * the import.meta.glob operation only runs once during the module initialization.
 * @example
 * ```typescript
 * import { AvatarManager, normalizeNameToFilename } from '@components/Avatar/avatars'
 *
 * const avatar = AvatarManager.getInstance().getAvatar('kevin-brown')
 * const allAvatars = AvatarManager.getInstance().getAll()
 * const filename = normalizeNameToFilename('Chris Southam') // 'chris-southam'
 * ```
 */

import type { ImageMetadata } from 'astro'
import { isDev } from '@components/scripts/utils/environmentClient'

type AvatarMap = Record<string, ImageMetadata>

/**
 * Normalize a person's name to a filename format
 * @param name - The person's name (e.g., "Chris Southam")
 * @returns The normalized filename (e.g., "chris-southam")
 * @example
 * ```typescript
 * normalizeNameToFilename('Chris Southam') // 'chris-southam'
 * normalizeNameToFilename('Kevin Brown') // 'kevin-brown'
 * ```
 */
export function normalizeNameToFilename(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric chars except hyphens
}

class AvatarManagerClass {
  private static instance: AvatarManagerClass
  private readonly avatarMap: Readonly<AvatarMap>

  private constructor() {
    // Eagerly import all avatar images during initialization
    const avatarModules = import.meta.glob('../../assets/images/avatars/*.{webp,jpg,png}', {
      eager: true,
      import: 'default',
    }) as Record<string, ImageMetadata>

    // Build the avatar mapping
    const map: AvatarMap = {}

    for (const [path, imageData] of Object.entries(avatarModules)) {
      // Extract filename without extension from path
      const filename = path
        .split('/')
        .pop()
        ?.replace(/\.(webp|jpg|png)$/i, '')

      if (filename && imageData) {
        // Deep freeze the image metadata to prevent modifications
        map[filename] = Object.freeze({ ...imageData })
      } else if (isDev()) {
        console.warn(`[AvatarManager] Failed to process avatar at path: ${path}`)
      }
    }

    // Freeze the map to prevent modifications
    this.avatarMap = Object.freeze(map)

    if (isDev()) {
      console.log(`[AvatarManager] Initialized with ${Object.keys(this.avatarMap).length} avatars`)
    }
  }

  /**
   * Get the singleton instance of AvatarManager
   */
  public static getInstance(): AvatarManagerClass {
    if (!AvatarManagerClass.instance) {
      AvatarManagerClass.instance = new AvatarManagerClass()
    }
    return AvatarManagerClass.instance
  }

  /**
   * Get an avatar image by filename (without extension)
   * @param filename - The filename without extension (e.g., 'kevin-brown')
   * @returns The image metadata or undefined if not found
   */
  public getAvatar(filename: string): ImageMetadata | undefined {
    return this.avatarMap[filename]
  }

  /**
   * Check if an avatar exists
   * @param filename - The filename without extension
   * @returns true if the avatar exists, false otherwise
   */
  public hasAvatar(filename: string): boolean {
    return filename in this.avatarMap
  }

  /**
   * Get all available avatar filenames
   * @returns Array of avatar filenames (without extensions)
   */
  public getAvailableAvatars(): readonly string[] {
    return Object.keys(this.avatarMap)
  }

  /**
   * Get the complete avatar map (read-only)
   * @returns Read-only avatar map
   */
  public getAll(): Readonly<AvatarMap> {
    return this.avatarMap
  }

  /**
   * Get the total number of avatars
   * @returns The count of available avatars
   */
  public get count(): number {
    return Object.keys(this.avatarMap).length
  }
}

// Export singleton instance
export const AvatarManager = AvatarManagerClass
