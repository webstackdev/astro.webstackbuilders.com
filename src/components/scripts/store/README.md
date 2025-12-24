# Nanostore Best Practices

## Observables

Do not use observables outside of store files. Provide actions for UI code to consume instead. This means no `$store.*` code directly in client code.

Expose derived values to client code from actions with naming to reflect their source. Do not use `computed()` outside of store files.

## Reduce `.get()` usage outside of tests

According to [nanostore docs](https://github.com/nanostores/nanostores#reduce-get-usage-outside-of-tests), `.get()` should primarily be used in tests. In UI code and store logic, prefer actions in the store file that expose:

- `$store.listen()` or `$store.subscribe()` for reactive updates, exposed via actions in the store file.
- `computed()` stores for derived values

Where `.get()` is appropriate:

✅ Tests (to assert current values)
✅ Inside action functions when computing new values (e.g., $counter.set($counter.get() + 1))

Where to avoid `.get()`:

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

/** Fake storage for tests, replaces localStorage with test engine */
beforeAll(() => {
  useTestStorageEngine()
})

/** Clear test storage between tests */
afterEach(() => {
  cleanTestStorage()
})

/** Simulate pre-existing data */
it('persists DataSubjectId to localStorage', () => {
  const id = getOrCreateDataSubjectId()
  expect(getTestStorage()).toHaveProperty('DataSubjectId', id)
})

/** Assert what was stored */
it('retrieves DataSubjectId from test storage', () => {
  setTestStorageKey('DataSubjectId', 'test-uuid-123')
  const id = getOrCreateDataSubjectId()
  expect(id).toBe('test-uuid-123')
})
```
