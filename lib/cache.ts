interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTTL: number; // Default time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
  cleanupInterval: number; // How often to clean up expired items
}

class Cache {
  private store: Map<string, CacheItem<any>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of Array.from(this.store.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.store.delete(key);
      }
    }

    // If cache is too large, remove oldest items
    if (this.store.size > this.config.maxSize) {
      const entries = Array.from(this.store.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.store.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.store.delete(key));
    }
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    };

    this.store.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    for (const item of Array.from(this.store.values())) {
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      total: this.store.size,
      valid: validCount,
      expired: expiredCount,
      hitRate: 0, // This would need to be tracked separately
    };
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.store.clear();
  }
}

// Create different cache instances for different purposes
export const caches = {
  // Subreddit rules cache (longer TTL since rules don't change often)
  subredditRules: new Cache({
    defaultTTL: 60 * 60 * 1000, // 1 hour
    maxSize: 1000,
    cleanupInterval: 30 * 60 * 1000, // 30 minutes
  }),

  // User data cache (shorter TTL for fresh data)
  userData: new Cache({
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  }),

  // API response cache (very short TTL)
  apiResponses: new Cache({
    defaultTTL: 30 * 1000, // 30 seconds
    maxSize: 500,
    cleanupInterval: 60 * 1000, // 1 minute
  }),

  // Rate limiting cache
  rateLimits: new Cache({
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    maxSize: 10000,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  }),
};

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  cache: Cache,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator(...args);
      const cached = cache.get(key);

      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      cache.set(key, result, ttl);
      return result;
    };
  };
}

// Utility functions for common caching patterns
export const cacheUtils = {
  // Generate cache key for subreddit rules
  subredditRulesKey: (subreddit: string) => `rules:${subreddit.toLowerCase()}`,

  // Generate cache key for user data
  userDataKey: (userId: string) => `user:${userId}`,

  // Generate cache key for API responses
  apiResponseKey: (endpoint: string, params: any) =>
    `api:${endpoint}:${JSON.stringify(params)}`,

  // Generate cache key for rate limiting
  rateLimitKey: (identifier: string, window: string) =>
    `rate_limit:${identifier}:${window}`,
};

// Cache middleware for API routes
export function withCache<T>(
  cache: Cache,
  keyGenerator: (req: any) => string,
  ttl?: number
) {
  return (handler: (req: any) => Promise<T>) => {
    return async (req: any) => {
      const key = keyGenerator(req);
      const cached = cache.get(key);

      if (cached !== null) {
        return cached;
      }

      const result = await handler(req);
      cache.set(key, result, ttl);
      return result;
    };
  };
}
