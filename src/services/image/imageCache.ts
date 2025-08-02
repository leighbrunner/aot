import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

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
}

class ImageCache {
  private config: CacheConfig = {
    maxSize: 100, // 100MB default
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days default
    cleanupInterval: 60 * 60 * 1000, // 1 hour default
  };
  
  private cacheKey = '@voting_app_image_cache';
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

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
      const indexData = await AsyncStorage.getItem(`${this.cacheKey}_index`);
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
   * Cache an image URL
   */
  async cacheImage(url: string, metadata?: any): Promise<void> {
    try {
      // Use Expo Image's caching mechanism
      await Image.prefetch(url);
      
      // Update cache index
      const entry: CacheEntry = {
        url,
        timestamp: Date.now(),
        metadata,
      };
      
      this.cacheIndex.set(url, entry);
      await this.saveCacheIndex();
    } catch (error) {
      console.error(`Failed to cache image ${url}:`, error);
    }
  }

  /**
   * Get cached image metadata
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
    
    return entry;
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
      // Clear Expo Image cache
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
      
      // Clear our index
      this.cacheIndex.clear();
      await AsyncStorage.removeItem(`${this.cacheKey}_index`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Remove a specific cache entry
   */
  private async removeCacheEntry(url: string): Promise<void> {
    this.cacheIndex.delete(url);
    await this.saveCacheIndex();
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexObject = Object.fromEntries(this.cacheIndex);
      await AsyncStorage.setItem(
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
    
    for (const [url, entry] of this.cacheIndex) {
      if (now - entry.timestamp > this.config.maxAge) {
        entriesToRemove.push(url);
      }
    }
    
    // Remove expired entries
    for (const url of entriesToRemove) {
      this.cacheIndex.delete(url);
    }
    
    if (entriesToRemove.length > 0) {
      await this.saveCacheIndex();
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldest: number | null = null;
    let newest: number | null = null;
    
    for (const entry of this.cacheIndex.values()) {
      if (!oldest || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (!newest || entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }
    
    return {
      totalEntries: this.cacheIndex.size,
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
    isCached: (url: string) => 
      imageCache.isCached(url),
    clearCache: () => 
      imageCache.clearCache(),
    getStats: () => 
      imageCache.getStats(),
  };
}