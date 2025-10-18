# Mastodon Integration

This directory contains the Mastodon sharing integration for the Webstack Builders website, adapted from [Share₂Fedi](https://github.com/kytta/share2fedi).

## Architecture

The integration uses the NodeInfo protocol to detect Mastodon instances and provides persistent localStorage storage for saved instances.

### Core Files

#### `detector.ts`

- **Purpose**: NodeInfo protocol implementation for Fediverse instance detection
- **Key Functions**:
  - `getSoftwareName(domain)`: Detects the Fediverse software running on a domain
  - `isMastodonInstance(domain)`: Checks if a domain is a Mastodon instance
  - `normalizeURL(url)`: Adds missing https:// prefix and trailing slash
  - `getUrlDomain(url)`: Extracts domain from URL string or URL object
- **Attribution**: Adapted from Share₂Fedi's nodeinfo.ts and url.ts

#### `store.ts`

- **Purpose**: localStorage management for saved Mastodon instances
- **Key Exports**:
  - `$savedInstances`: Persistent store for up to 5 saved instance domains
  - `$currentInstance`: Store for currently selected instance
  - `saveInstance(instance)`: Saves an instance (most recent first, oldest removed)
  - `removeInstance(instance)`: Removes an instance from storage
  - `clearInstances()`: Clears all saved instances
  - `getSavedInstances()`: Gets all saved instances as array
- **Attribution**: Adapted from Share₂Fedi's saved-instances.ts

#### `config.ts`

- **Purpose**: Mastodon share endpoint configuration
- **Key Exports**:
  - `mastodonConfig`: Share endpoint configuration matching Share₂Fedi pattern
  - `buildShareUrl(instance, text)`: Builds complete Mastodon share URL

## Usage Example

```typescript
import { getSoftwareName, isMastodonInstance } from './detector'
import { saveInstance, getSavedInstances } from './store'
import { buildShareUrl } from './config'

// Detect instance
const software = await getSoftwareName('mastodon.social')
// Returns: 'mastodon'

// Check if Mastodon
const isMastodon = await isMastodonInstance('mastodon.social')
// Returns: true

// Save instance
saveInstance('mastodon.social')

// Get saved instances
const saved = getSavedInstances()
// Returns: ['mastodon.social']

// Build share URL
const url = buildShareUrl('mastodon.social', 'Hello Fediverse!')
// Returns: 'https://mastodon.social/share?text=Hello%20Fediverse!'
```

## Dependencies

- `nanostores`: Minimal state management
- `@nanostores/persistent`: localStorage persistence for stores

## NodeInfo Protocol

The integration uses the [NodeInfo protocol](http://nodeinfo.diaspora.software/) to detect Fediverse instances:

1. Fetch `/.well-known/nodeinfo` from the domain
2. Parse the links array to find supported schema versions (1.0, 1.1, 2.0, 2.1)
3. Fetch the nodeinfo JSON from the href
4. Extract `software.name` to identify the platform

Supported Mastodon flavours:

- Mastodon (official)
- Hometown
- Fedibird
- GlitchCafé

## License

AGPL-3.0-only

This code is adapted from Share₂Fedi by Nikita Karamov and modified by Kevin Brown.

## Attribution

Significant portions of this code are adapted from [Share₂Fedi](https://github.com/kytta/share2fedi):

- SPDX-FileCopyrightText: © 2023 Nikita Karamov <me@kytta.dev>
- SPDX-FileCopyrightText: © 2025 Kevin Brown <kevin@webstackbuilders.com>
- SPDX-License-Identifier: AGPL-3.0-only

## Next Steps

To complete the Mastodon integration:

1. Create modal UI components (`Modal.astro`, `InstanceSelector.astro`)
2. Add Mastodon to `src/components/Social/common/platforms.ts`
3. Update Highlighter component to show Mastodon icon
4. Update Shares component with Mastodon button
5. Add Mastodon icon to `src/icons/`
6. Write comprehensive unit tests
7. Update component READMEs with Mastodon documentation
