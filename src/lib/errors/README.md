# Error Handling

Centralized error handling system for client-side JavaScript.

## Design Principles

1. **Single Location**: All errors route through `handleError()` - this is the ONLY place where `Sentry.captureException()` or `console.error()` is called
2. **Environment Aware**: Development mode shows detailed console output, production sends to Sentry
3. **Type Safe**: TypeScript support with proper error types
4. **Simple**: Minimal abstraction over Sentry/console

## Usage

### Basic Error Handling

```typescript
import { handleError } from '@lib/errors'

try {
  // risky operation
  throw new Error('Something went wrong')
} catch (error) {
  handleError(error, {
    component: 'MyComponent',
    action: 'submit'
  })
}
```

### Async Error Handling

```typescript
import { handleAsyncError } from '@lib/errors'

const fetchData = handleAsyncError(async () => {
  const response = await fetch('/api/data')
  return response.json()
}, {
  component: 'DataFetcher',
  action: 'fetch'
})
```

### Event Handler Wrapping

```typescript
import { withErrorHandling } from '@lib/errors'

const handleClick = withErrorHandling((event) => {
  // handler logic
  console.log('Button clicked', event)
}, {
  component: 'Button',
  action: 'click'
})

button.addEventListener('click', handleClick)
```

### Custom Error with Context

```typescript
import { ClientScriptError, handleError } from '@lib/errors'

const error = new ClientScriptError('Invalid form data', {
  component: 'ContactForm',
  action: 'validate',
  fieldName: 'email'
})

handleError(error)
```

## API Reference

### `handleError(error, context?)`

Main error handling function. Routes to Sentry (production) or console (development).

**Parameters:**

- `error: unknown` - The error to handle (Error, string, or any value)
- `context?: ErrorContext` - Optional context metadata

**Context Properties:**

- `component?: string` - Component where error occurred
- `action?: string` - Action being performed
- `userId?: string` - User ID if available
- `[key: string]: unknown` - Any additional metadata

### `handleAsyncError(fn, context?)`

Wraps an async function with error handling.

**Parameters:**

- `fn: () => Promise<T>` - Async function to wrap
- `context?: ErrorContext` - Optional context metadata

**Returns:** Promise that resolves to function result or undefined on error

### `withErrorHandling(handler, context?)`

Wraps a function (typically event handler) with error handling.

**Parameters:**

- `handler: (...args) => unknown` - Function to wrap
- `context?: ErrorContext` - Optional context metadata

**Returns:** Wrapped function with same signature

### `ClientScriptError`

Custom error class with context support.

**Constructor:**

```typescript
new ClientScriptError(message: string, context?: ErrorContext)
```

**Methods:**

- `toJSON()` - Convert to plain object for serialization

## Environment Behavior

### Development (`import.meta.env.DEV`)

- Logs to console with `console.error()`
- Includes full error message, stack trace, and context
- Context logged as separate object for easy inspection

### Production (`import.meta.env.PROD`)

- Sends to Sentry via `Sentry.captureException()`
- Includes context as extra data
- Stack traces automatically captured by Sentry

## Migration from Old System

### Before (Old Logger)

```typescript
import { log } from '@components/Scripts/logger'

try {
  // operation
} catch (error) {
  log(error, 'Component', 'action')
}
```

### After (New Handler with Old Logger)

```typescript
import { handleError } from '@lib/errors'

try {
  // operation
} catch (error) {
  handleError(error, {
    component: 'Component',
    action: 'action'
  })
}
```

### Before (Direct Console)

```typescript
try {
  // operation
} catch (error) {
  console.error('Error in MyComponent:', error)
}
```

### After (New Handler with Direct Console)

```typescript
import { handleError } from '@lib/errors'

try {
  // operation
} catch (error) {
  handleError(error, {
    component: 'MyComponent'
  })
}
```

## Files

- **`ClientScriptError.ts`** - Custom error class with context support
- **`errorHandler.ts`** - Main error handling logic (the single location for Sentry/console calls)
- **`index.ts`** - Module exports

## Sentry Integration

Sentry integration is configured but the actual `captureException` call is commented out until Sentry is ready.

To enable Sentry:

1. Uncomment the Sentry import in `errorHandler.ts`
2. Configure Sentry in your Scripts/index.astro
3. Set `SENTRY_DSN` environment variable

The rest of the codebase doesn't need to change - error routing happens automatically based on `import.meta.env.PROD`.

## See Also

- [Logger Documentation](../logger/README.md) - For non-error logging
- [ERROR_LOGGING_ANALYSIS.md](/docs/ERROR_LOGGING_ANALYSIS.md) - Original analysis and migration plan
