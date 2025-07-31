/**
 * Simple in-memory cache implementation
 * In production, consider using Redis or a similar distributed cache
 */
export class InMemoryCache {
  private store = new Map<string, { data: any; expires: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      data: value,
      expires: Date.now() + ttlSeconds * 1000
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Export a singleton instance
export const cache = new InMemoryCache();

// Type for cached data
export interface CachedData<T> {
  data: T;
  expires: number;
}
