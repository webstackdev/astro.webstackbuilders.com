# Nanostore Best Practices

## Reduce `.get()` usage outside of tests

According to [nanostore docs](https://github.com/nanostores/nanostores#reduce-get-usage-outside-of-tests), `.get()` should primarily be used in tests. In UI code and store logic, prefer:

- `$store.listen()` or `$store.subscribe()` for reactive updates
- `computed()` stores for derived values

Where .get() is appropriate:

✅ Tests (to assert current values)
✅ Inside action functions when computing new values (e.g., $counter.set($counter.get() + 1))

Where to avoid .get():

❌ UI components - use useStore($store) instead
❌ Reactive logic - use $store.listen() or $store.subscribe()
❌ Derived values - use computed() stores

## Use test storage API for localStorage testing

[@nanostores/persistent](https://github.com/nanostores/persistent#tests) provides test helpers:

```typescript
import {
  useTestStorageEngine,
  setTestStorageKey,
  cleanTestStorage,
  getTestStorage,
} from '@nanostores/persistent'

beforeAll(() => {
  useTestStorageEngine()  // Replace localStorage with test engine
})

afterEach(() => {
  cleanTestStorage()  // Clear test storage between tests
})

it('persists DataSubjectId to localStorage', () => {
  const id = getOrCreateDataSubjectId()
  expect(getTestStorage()).toHaveProperty('DataSubjectId', id)
})

it('retrieves DataSubjectId from test storage', () => {
  setTestStorageKey('DataSubjectId', 'test-uuid-123')
  const id = getOrCreateDataSubjectId()
  expect(id).toBe('test-uuid-123')
})
```

## Test API Documentation

Added complete examples of using the @nanostores/persistent test API with:

useTestStorageEngine() - Fake storage for tests
cleanTestStorage() - Clean between tests
setTestStorageKey() - Simulate pre-existing data
getTestStorage() - Assert what was stored
