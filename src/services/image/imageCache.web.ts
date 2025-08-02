interface CacheConfig {
  maxSize: number; // Maximum cache size in MB
  maxAge: number; // Maximum age in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

interface CacheEntry {
  url: string;
  timestamp: number;
  size?: number;
  metadata?: any;
  blob?: Blob;
}

class ImageCache {
  private config: CacheConfig = {
    maxSize: 100, // 100MB default
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days default
    cleanupInterval: 60 * 60 * 1000, // 1 hour default
  };
  
  private cacheKey = 'voting_app_image_cache';
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private cleanupTimer: number | null = null;
  private dbName = 'VotingAppImageCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeCache();
  }

  /**
   * Initialize cache and load index from storage
   */
  private async initializeCache(): Promise<void> {
    try {
      // Initialize IndexedDB
      await this.initializeDB();
      
      // Load index from localStorage
      const indexData = localStorage.getItem(`${this.cacheKey}_index`);
      if (indexData) {
        const index = JSON.parse(indexData);
        this.cacheIndex = new Map(Object.entries(index));
      }
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      // Run initial cleanup
      this.cleanup();
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Initialize IndexedDB for blob storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
      };
    });
  }

  /**
   * Cache an image URL
   */
  async cacheImage(url: string, metadata?: any): Promise<void> {
    try {
      // Fetch the image
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const size = blob.size;
      
      // Store blob in IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        await new Promise((resolve, reject) => {
          const request = store.put({
            url,
            blob,
            timestamp: Date.now(),
            size,
            metadata,
          });
          request.onsuccess = () => resolve(undefined);
          request.onerror = () => reject(request.error);
        });
      }
      
      // Update cache index
      const entry: CacheEntry = {
        url,
        timestamp: Date.now(),
        size,
        metadata,
      };
      
      this.cacheIndex.set(url, entry);
      await this.saveCacheIndex();
    } catch (error) {
      console.error(`Failed to cache image ${url}:`, error);
    }
  }

  /**
   * Get cached image
   */
  async getCachedImage(url: string): Promise<CacheEntry | null> {
    const entry = this.cacheIndex.get(url);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      await this.removeCacheEntry(url);
      return null;
    }
    
    // Get blob from IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      
      const cachedData = await new Promise<any>((resolve, reject) => {
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (cachedData && cachedData.blob) {
        return {
          ...entry,
          blob: cachedData.blob,
        };
      }
    }
    
    return entry;
  }

  /**
   * Get cached image as object URL
   */
  async getCachedImageUrl(url: string): Promise<string | null> {
    const cached = await this.getCachedImage(url);
    if (cached && cached.blob) {
      return URL.createObjectURL(cached.blob);
    }
    return null;
  }

  /**
   * Check if an image is cached
   */
  isCached(url: string): boolean {
    const entry = this.cacheIndex.get(url);
    if (!entry) return false;
    
    // Check if not expired
    return Date.now() - entry.timestamp <= this.config.maxAge;
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    try {
      // Clear IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve(undefined);
          request.onerror = () => reject(request.error);
        });
      }
      
      // Clear index
      this.cacheIndex.clear();
      localStorage.removeItem(`${this.cacheKey}_index`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Remove a specific cache entry
   */
  private async removeCacheEntry(url: string): Promise<void> {
    // Remove from IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      await new Promise((resolve, reject) => {
        const request = store.delete(url);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    }
    
    // Remove from index
    this.cacheIndex.delete(url);
    await this.saveCacheIndex();
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexObject = Object.fromEntries(this.cacheIndex);
      localStorage.setItem(
        `${this.cacheKey}_index`,
        JSON.stringify(indexObject)
      );
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const entriesToRemove: string[] = [];
    let totalSize = 0;
    
    // Check for expired entries and calculate total size
    for (const [url, entry] of this.cacheIndex) {
      if (now - entry.timestamp > this.config.maxAge) {
        entriesToRemove.push(url);
      } else if (entry.size) {
        totalSize += entry.size;
      }
    }
    
    // Remove expired entries
    for (const url of entriesToRemove) {
      await this.removeCacheEntry(url);
    }
    
    // Check if we need to remove entries due to size limit
    if (totalSize > this.config.maxSize * 1024 * 1024) {
      const entries = Array.from(this.cacheIndex.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      while (totalSize > this.config.maxSize * 1024 * 1024 && entries.length > 0) {
        const [url, entry] = entries.shift()!;
        if (entry.size) {
          totalSize -= entry.size;
        }
        await this.removeCacheEntry(url);
      }
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    let oldest: number | null = null;
    let newest: number | null = null;
    let totalSize = 0;
    
    for (const entry of this.cacheIndex.values()) {
      if (!oldest || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (!newest || entry.timestamp > newest) {
        newest = entry.timestamp;
      }
      if (entry.size) {
        totalSize += entry.size;
      }
    }
    
    return {
      totalEntries: this.cacheIndex.size,
      totalSize,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }

  /**
   * Destroy cache instance and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

// Export hook for React components
export function useImageCache() {
  return {
    cacheImage: (url: string, metadata?: any) => 
      imageCache.cacheImage(url, metadata),
    getCachedImage: (url: string) => 
      imageCache.getCachedImage(url),
    getCachedImageUrl: (url: string) => 
      imageCache.getCachedImageUrl(url),
    isCached: (url: string) => 
      imageCache.isCached(url),
    clearCache: () => 
      imageCache.clearCache(),
    getStats: () => 
      imageCache.getStats(),
  };
}