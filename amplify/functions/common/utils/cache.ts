/**
 * In-memory cache for Lambda functions
 * Cache persists across invocations within the same container
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

class LambdaCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum number of entries
  private defaultTTL = 300000; // 5 minutes default

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    // Check cache size and evict if needed
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    hitRates: Record<string, number>;
  } {
    const hitRates: Record<string, number> = {};
    const keys: string[] = [];

    this.cache.forEach((entry, key) => {
      keys.push(key);
      hitRates[key] = entry.hits;
    });

    return {
      size: this.cache.size,
      keys,
      hitRates,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let minHits = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// Global cache instance
export const lambdaCache = new LambdaCache();

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  ttlMs?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      const cacheKey = keyGenerator(...args);
      
      // Check cache
      const cachedValue = lambdaCache.get<ReturnType<T>>(cacheKey);
      if (cachedValue !== null) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return cachedValue;
      }

      // Execute original method
      console.log(`Cache miss for key: ${cacheKey}`);
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      lambdaCache.set(cacheKey, result, ttlMs);
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Simple cache wrapper function
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  // Check cache
  const cached = lambdaCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const result = await fetcher();
  lambdaCache.set(key, result, ttlMs);
  
  return result;
}