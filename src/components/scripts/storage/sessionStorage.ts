export function getSessionStorageItem(key: string): string | null {
  try {
    const storage = (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage
    if (!storage || typeof storage.getItem !== 'function') {
      return null
    }

    return storage.getItem(key)
  } catch {
    return null
  }
}

export function setSessionStorageItem(key: string, value: string): boolean {
  try {
    const storage = (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage
    if (!storage || typeof storage.setItem !== 'function') {
      return false
    }

    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeSessionStorageItem(key: string): boolean {
  try {
    const storage = (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage
    if (!storage || typeof storage.removeItem !== 'function') {
      return false
    }

    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function clearSessionStorage(): boolean {
  try {
    const storage = (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage
    if (!storage || typeof storage.clear !== 'function') {
      return false
    }

    storage.clear()
    return true
  } catch {
    return false
  }
}
