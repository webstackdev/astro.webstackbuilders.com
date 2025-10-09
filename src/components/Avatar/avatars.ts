/**
 * Avatar Manager - Singleton class for managing avatar images
 *
 * Dynamically imports all avatar images from the avatars directory and provides
 * utilities for accessing them by filename. The singleton pattern ensures that
 * the import.meta.glob operation only runs once during the module initialization.
 * @example
 * ```typescript
 * import { AvatarManager } from '@components/Avatar/avatars'
 *
 * const avatar = AvatarManager.getInstance().getAvatar('kevin-brown')
 * const allAvatars = AvatarManager.getInstance().getAll()
 * ```
 */

type ImageMetadata = {
  src: string
  width: number
  height: number
  format: string
}

type AvatarMap = Record<string, ImageMetadata>

class AvatarManagerClass {
  private static instance: AvatarManagerClass
  private readonly avatarMap: Readonly<AvatarMap>

  private constructor() {
    // Eagerly import all avatar images during initialization
    const avatarModules = import.meta.glob('../../assets/images/avatars/*.{webp,jpg,png}', {
      eager: true,
      import: 'default'
    }) as Record<string, ImageMetadata>

    // Build the avatar mapping
    const map: AvatarMap = {}

    for (const [path, imageData] of Object.entries(avatarModules)) {
      // Extract filename without extension from path
      const filename = path.split('/').pop()?.replace(/\.(webp|jpg|png)$/i, '')

      if (filename && imageData) {
        map[filename] = imageData
      } else if (process.env['NODE_ENV'] === 'development') {
        console.warn(`[AvatarManager] Failed to process avatar at path: ${path}`)
      }
    }

    // Freeze the map to prevent modifications
    this.avatarMap = Object.freeze(map)

    if (process.env['NODE_ENV'] === 'development') {
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

// Backward-compatible exports for existing code
const instance = AvatarManager.getInstance()

/**
 * @deprecated Use AvatarManager.getInstance().getAll() instead
 */
export const avatarMap = instance.getAll()

/**
 * Get avatar image by filename
 * @deprecated Use AvatarManager.getInstance().getAvatar() instead
 */
export function getAvatarImage(filename: string): ImageMetadata | undefined {
  return instance.getAvatar(filename)
}

/**
 * Get all available avatar filenames
 * @deprecated Use AvatarManager.getInstance().getAvailableAvatars() instead
 */
export function getAvailableAvatars(): readonly string[] {
  return instance.getAvailableAvatars()
}
