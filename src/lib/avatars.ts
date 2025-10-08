// Avatar utilities for dynamically importing avatar images
const avatarModules = import.meta.glob('../assets/images/avatars/*.{webp,jpg,png}', {
  eager: true,
  import: 'default'
}) as Record<string, ImageMetadata>

// Create avatar mapping by extracting filename (without extension) as key
export const avatarMap: Record<string, ImageMetadata> = {}

for (const [path, imageData] of Object.entries(avatarModules)) {
  // Extract filename without extension from path
  const filename = path.split('/').pop()?.replace(/\.(webp|jpg|png)$/, '')
  if (filename) {
    avatarMap[filename] = imageData
  }
}

// Function to get avatar image by filename
export function getAvatarImage(filename: string): ImageMetadata | undefined {
  return avatarMap[filename]
}

// Get all available avatar filenames
export function getAvailableAvatars(): string[] {
  return Object.keys(avatarMap)
}