# Avatar Component

A reusable Avatar component for displaying user/author avatar images with automatic fallback to initials.

## Features

- ✅ Displays avatar images from the avatars directory
- ✅ Automatic name normalization (e.g., "Chris Southam" → "chris-southam")
- ✅ Automatic fallback to initial placeholder if image doesn't exist
- ✅ Renders nothing if name is not provided
- ✅ Singleton pattern for efficient image loading
- ✅ Type-safe with TypeScript
- ✅ Lazy loading by default

## Usage

```astro
---
import Avatar from '@components/Avatar/index.astro'
---

<!-- Basic usage - name is automatically normalized -->
<Avatar name="Kevin Brown" />

<!-- If avatar doesn't exist, shows 'K' initial -->
<Avatar name="Jane Doe" />

<!-- Custom CSS class -->
<Avatar
  name="Chris Southam"
  class="custom-avatar-style"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes | The person's name (automatically normalized for filename lookup) |
| `class` | `string` | No | Additional CSS classes to apply to the container |

## Name Normalization

The component automatically normalizes names to match avatar filenames:

- `"Kevin Brown"` → `kevin-brown.webp`
- `"Chris Southam"` → `chris-southam.webp`
- `"JOHN DOE"` → `john-doe.webp`

The normalization process:

1. Converts to lowercase
2. Trims whitespace
3. Replaces spaces with hyphens
4. Removes non-alphanumeric characters (except hyphens)

## File Structure

```text
src/components/Avatar/
├── index.astro        # Main Avatar component
├── avatars.ts         # Avatar Manager singleton for loading images
└── README.md          # This file
```

## Avatar Manager

The `avatars.ts` file contains a singleton class that manages all avatar images:

```typescript
import { AvatarManager } from '@components/Avatar/avatars'

// Get avatar instance
const manager = AvatarManager.getInstance()

// Get specific avatar
const avatar = manager.getAvatar('kevin-brown')

// Check if avatar exists
if (manager.hasAvatar('jane-doe')) {
  // ...
}

// Get all available avatars
const allAvatars = manager.getAvailableAvatars()

// Get count
console.log(`Total avatars: ${manager.count}`)
```

## Backward Compatibility

For existing code, the following functions are still exported but deprecated:

```typescript
import { getAvatarImage, avatarMap, getAvailableAvatars } from '@components/Avatar/avatars'

// These still work but are marked as deprecated
const avatar = getAvatarImage('kevin-brown')
```

## Adding New Avatars

1. Add image files to `src/assets/images/avatars/`
2. Supported formats: `.webp`, `.jpg`, `.png`
3. Naming convention: Use kebab-case (e.g., `kevin-brown.webp`)
4. The Avatar Manager will automatically detect and load them

## Styling

The component renders with the following structure:

```html
<div class="avatar-container [your-custom-class]">
  <!-- If image exists: -->
  <img src="..." alt="Photo of Name" loading="lazy" class="avatar-image" />

  <!-- If image doesn't exist but personName provided: -->
  <div class="avatar-placeholder ...">
    K
  </div>
</div>
```

You can style these classes in your CSS or pass custom Tailwind classes via the `class` prop.

## Migration from Testimonials

Previously, avatar rendering was inline in the Testimonials component:

```astro
<!-- Old approach (before component extraction) -->
{avatarImage ? (
  <img src={avatarImage.src} alt={avatarAlt} loading="lazy" />
) : (
  <div class="avatar-placeholder">
    {testimonial.data.name.charAt(0)}
  </div>
)}

<!-- New approach (current) -->
<Avatar
  name={testimonial.data.name}
  class="mod-testimonials__item-avatar"
/>
```

**Benefits of the new approach:**

- ✅ Single `name` prop instead of separate `avatarName` and `personName`
- ✅ Automatic normalization (no need to pre-format names)
- ✅ Cleaner testimonial frontmatter (no `avatar:` field needed)
- ✅ Better separation of concerns
- ✅ Easier to use and maintain

## Performance

- **Singleton Pattern**: The `import.meta.glob` operation runs only once
- **Lazy Loading**: Images are lazy-loaded by default
- **Immutable Cache**: Avatar map is frozen to prevent accidental modifications
- **Efficient Lookups**: O(1) lookup time for avatar images
