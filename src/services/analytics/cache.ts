type CacheEntry<T> = { value: T; expiresAt: number }

const CACHE_TTL_MS = 60 * 1000 // 60s default
const store = new Map<string, CacheEntry<unknown>>()

export function getCache<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number = CACHE_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function clearCache(key?: string): void {
  if (key) store.delete(key)
  else store.clear()
}
