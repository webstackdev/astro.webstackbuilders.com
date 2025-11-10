# Improvements to Stores

**Nanostore Best Practices:**

1. **Reduce `.get()` usage outside of tests** - According to [nanostore docs](https://github.com/nanostores/nanostores#reduce-get-usage-outside-of-tests), `.get()` should primarily be used in tests. In UI code and store logic, prefer:
   - `useStore($store)` in React components
   - `$store.listen()` or `$store.subscribe()` for reactive updates
   - `computed()` stores for derived values

2. **Use test storage API for localStorage testing** - [@nanostores/persistent](https://github.com/nanostores/persistent#tests) provides test helpers:

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

**Action items:**
- Review existing store code for `.get()` usage in action functions
- Refactor to use subscriptions/listeners instead where appropriate
- `.get()` is fine for reading current value within action functions that need to compute new values

Key Points Added

1. Reduce .get() Usage Outside Tests

Where .get() is appropriate:

✅ Tests (to assert current values)
✅ Inside action functions when computing new values (e.g., $counter.set($counter.get() + 1))

Where to avoid .get():

❌ UI components - use useStore($store) instead
❌ Reactive logic - use $store.listen() or $store.subscribe()
❌ Derived values - use computed() stores

2. Current Usage in Your Codebase

Looking at your code, most .get() usage is actually fine:

Tests (✅ Correct usage):

consent.spec.ts - All .get() calls are in test assertions
themes.spec.ts - All .get() calls are in test assertions

Action functions (✅ Correct usage):

consent.ts line 111: const currentConsent = $consent.get() - Reading current value to compute new value
themes.ts lines 137, 180: Reading store to check/apply theme
visibility.ts lines 63, 81, 99: Reading current value to compute new value
socialEmbeds.ts lines 57, 73, 79: Reading cache to update it

Potential improvement:

mastodonInstances.ts line 46: const hasFunctionalConsent = $consent.get().functional - This could be refactored to use a computed() store or subscription

3. Test API Documentation

Added complete examples of using the @nanostores/persistent test API with:

useTestStorageEngine() - Fake storage for tests
cleanTestStorage() - Clean between tests
setTestStorageKey() - Simulate pre-existing data
getTestStorage() - Assert what was stored

Your current code is mostly following best practices already. The main action item would be to review mastodonInstances.ts and similar files for opportunities to use computed() stores instead of .get() for reactive derived values.