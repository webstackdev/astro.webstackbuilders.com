# Logger

Simple development logging utility for client-side JavaScript.

## Design Principles

1. **Development Only**: Only logs in development mode (`import.meta.env.DEV`)
2. **Zero Dependencies**: No external packages, just native `console` methods
3. **Visual Indicators**: Emoji prefixes for quick log level identification
4. **Browser Native**: Uses browser DevTools styling, not ANSI colors

## Usage

```typescript
import { logger } from '@lib/logger'

// Error logging (use handleError from @lib/errors for actual errors)
logger.error('Validation failed', { field: 'email' })

// Warnings
logger.warn('API rate limit approaching', { remaining: 10 })

// Info messages
logger.info('User session started', { userId: '123' })

// Debug messages
logger.debug('Cache hit', { key: 'user-prefs' })

// Success messages
logger.success('Form submitted', { formId: 'contact' })
```

## API Reference

### `logger.error(message, data?)`

Log error messages. For actual error handling, use `handleError` from `@lib/errors`.

**Parameters:**

- `message: string` - Error message
- `data?: unknown` - Optional data to log

**Output:** `❌ [Error Message]` + data object

### `logger.warn(message, data?)`

Log warning messages.

**Parameters:**

- `message: string` - Warning message
- `data?: unknown` - Optional data to log

**Output:** `⚠️ [Warning Message]` + data object

### `logger.info(message, data?)`

Log informational messages.

**Parameters:**

- `message: string` - Info message
- `data?: unknown` - Optional data to log

**Output:** `ℹ️ [Info Message]` + data object

### `logger.debug(message, data?)`

Log debug messages.

**Parameters:**

- `message: string` - Debug message
- `data?: unknown` - Optional data to log

**Output:** `🐛 [Debug Message]` + data object

### `logger.success(message, data?)`

Log success messages.

**Parameters:**

- `message: string` - Success message
- `data?: unknown` - Optional data to log

**Output:** `✅ [Success Message]` + data object

## When to Use

### Use Logger For

- Development debugging
- Tracking application flow
- Monitoring state changes
- Performance measurements
- Success confirmations

### Use Error Handler For

- Actual error handling
- Production error tracking
- Sentry integration
- Error recovery logic

## Examples

### Form Validation

```typescript
import { logger } from '@lib/logger'
import { handleError } from '@lib/errors'

function validateForm(data: FormData) {
  logger.debug('Validating form', { fields: data.keys() })

  try {
    // validation logic
    logger.success('Form validation passed')
    return true
  } catch (error) {
    handleError(error, {
      component: 'FormValidator',
      action: 'validate'
    })
    return false
  }
}
```

### API Calls

```typescript
import { logger } from '@lib/logger'
import { handleError } from '@lib/errors'

async function fetchData() {
  logger.info('Fetching data from API')

  try {
    const response = await fetch('/api/data')
    const data = await response.json()

    logger.success('Data fetched', { count: data.length })
    return data
  } catch (error) {
    handleError(error, {
      component: 'DataFetcher',
      action: 'fetch'
    })
    return null
  }
}
```

### State Changes

```typescript
import { logger } from '@lib/logger'

function updateTheme(theme: string) {
  logger.debug('Theme changing', { from: currentTheme, to: theme })

  document.documentElement.setAttribute('data-theme', theme)

  logger.info('Theme updated', { theme })
}
```

## Production Behavior

In production (`import.meta.env.PROD`), all logger methods are no-ops (do nothing). This ensures:

- Zero console output in production
- No performance impact
- Clean user console experience

## Migration from Old Logger

### Before

```typescript
import { log } from '@components/Scripts/logger'

log(new Error('Something failed'), 'Component', 'action')
```

### After

For errors, use error handler:

```typescript
import { handleError } from '@lib/errors'

handleError(new Error('Something failed'), {
  component: 'Component',
  action: 'action'
})
```

For debugging, use new logger:

```typescript
import { logger } from '@lib/logger'

logger.debug('Operation completed', {
  component: 'Component',
  action: 'action'
})
```

## See Also

- [Error Handler Documentation](../errors/README.md) - For error handling
- [ERROR_LOGGING_ANALYSIS.md](/docs/ERROR_LOGGING_ANALYSIS.md) - Original analysis
