# Avatar Component

A reusable Avatar component for displaying user/author avatar images with automatic fallback to initials.

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

## Adding New Avatars

1. Add image files to `src/assets/images/avatars/`
2. Supported formats: `.webp`, `.jpg`, `.png`
3. Naming convention: Use kebab-case (e.g., `kevin-brown.webp`)
4. The Avatar Manager will automatically detect and load them
