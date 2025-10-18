/*!
 * Adapted from Share₂Fedi
 * https://github.com/kytta/share2fedi
 *
 * SPDX-FileCopyrightText: © 2023 Nikita Karamov <me@kytta.dev>
 * SPDX-FileCopyrightText: © 2025 Kevin Brown <kevin@webstackbuilders.com>
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { persistentAtom } from '@nanostores/persistent'
import { getUrlDomain } from './detector'

const LOCAL_STORAGE_KEY = 'mastodonInstances'
const CAPACITY = 5

/**
 * Persistent store for saved Mastodon instance domains.
 * Stores up to 5 instances in localStorage as a Set.
 */
export const $savedInstances = persistentAtom<Set<string>>(LOCAL_STORAGE_KEY, new Set(), {
  encode: (set: Set<string>) => JSON.stringify([...set]),
  decode: (value: string) => new Set(JSON.parse(value) as string[]),
})

/**
 * Store for the currently selected/active instance.
 */
export const $currentInstance = persistentAtom<string | undefined>(
  'mastodonCurrentInstance',
  undefined
)

/**
 * Saves an instance domain to the store.
 * Most recently used instances appear first, oldest are removed when capacity is exceeded.
 *
 * @param instance - The instance URL or domain to save
 */
export function saveInstance(instance: string): void {
  const domain = getUrlDomain(instance)
  $savedInstances.set(new Set([domain, ...$savedInstances.get()].slice(0, CAPACITY)))
}

/**
 * Removes an instance domain from the store.
 *
 * @param instance - The instance URL or domain to remove
 */
export function removeInstance(instance: string): void {
  const domain = getUrlDomain(instance)
  const instances = $savedInstances.get()
  instances.delete(domain)
  $savedInstances.set(new Set(instances))
}

/**
 * Clears all saved instances from localStorage.
 */
export function clearInstances(): void {
  $savedInstances.set(new Set())
}

/**
 * Gets all saved instances as an array.
 * Most recently used instances appear first.
 */
export function getSavedInstances(): string[] {
  return [...$savedInstances.get()]
}
