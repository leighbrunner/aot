import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

interface CacheEntry {
  uri: string;
  timestamp: number;
  size?: number;
}

class ImageOptimizer {
  private cacheDir = `${FileSystem.cacheDirectory}images/`;
  private cache = new Map<string, CacheEntry>();
  private preloadQueue: string[] = [];
  private isPreloading = false;
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache directory
   */
  private async initializeCache() {
    if (Platform.OS === 'web') return;

    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
      
      // Load existing cache entries
      await this.loadCacheIndex();
      
      // Clean old entries
      await this.cleanCache();
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Get optimized image URI (from cache if available)
   */
  async getOptimizedUri(uri: string): Promise<string> {
    if (Platform.OS === 'web') return uri;

    const cacheKey = await this.getCacheKey(uri);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      const fileInfo = await FileSystem.getInfoAsync(cached.uri);
      if (fileInfo.exists) {
        // Update timestamp for LRU
        cached.timestamp = Date.now();
        return cached.uri;
      }
    }

    // Download and cache
    return this.downloadAndCache(uri, cacheKey);
  }

  /**
   * Preload multiple images
   */
  async preloadImages(uris: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, use browser's image preloading
      uris.forEach(uri => {
        const img = new window.Image();
        img.src = uri;
      });
      return;
    }

    // Add to preload queue
    this.preloadQueue.push(...uris);
    
    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  /**
   * Process preload queue
   */
  private async processPreloadQueue() {
    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, 3); // Process 3 at a time
      
      await Promise.all(
        batch.map(uri => this.getOptimizedUri(uri).catch(err => 
          console.warn('Failed to preload image:', uri, err)
        ))
      );
    }

    this.isPreloading = false;
  }

  /**
   * Download and cache image
   */
  private async downloadAndCache(uri: string, cacheKey: string): Promise<string> {
    try {
      const localUri = `${this.cacheDir}${cacheKey}`;
      
      const downloadResult = await FileSystem.downloadAsync(uri, localUri);
      
      if (downloadResult.status === 200) {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        
        // Store in cache index
        this.cache.set(cacheKey, {
          uri: localUri,
          timestamp: Date.now(),
          size: fileInfo.size,
        });
        
        // Save cache index
        await this.saveCacheIndex();
        
        // Check cache size and clean if needed
        await this.checkCacheSize();
        
        return localUri;
      }
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
    
    return uri; // Return original URI on failure
  }

  /**
   * Generate cache key from URI
   */
  private async getCacheKey(uri: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      uri
    );
    const extension = uri.split('.').pop() || 'jpg';
    return `${hash}.${extension}`;
  }

  /**
   * Load cache index from disk
   */
  private async loadCacheIndex() {
    try {
      const indexPath = `${this.cacheDir}index.json`;
      const fileInfo = await FileSystem.getInfoAsync(indexPath);
      
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(indexPath);
        const index = JSON.parse(content);
        
        // Convert to Map
        Object.entries(index).forEach(([key, value]) => {
          this.cache.set(key, value as CacheEntry);
        });
      }
    } catch (error) {
      console.error('Failed to load cache index:', error);
    }
  }

  /**
   * Save cache index to disk
   */
  private async saveCacheIndex() {
    try {
      const indexPath = `${this.cacheDir}index.json`;
      const index: Record<string, CacheEntry> = {};
      
      this.cache.forEach((value, key) => {
        index[key] = value;
      });
      
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * Clean old cache entries
   */
  private async cleanCache() {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxCacheAge) {
        entriesToDelete.push(key);
      }
    });

    await Promise.all(
      entriesToDelete.map(async key => {
        const entry = this.cache.get(key);
        if (entry) {
          try {
            await FileSystem.deleteAsync(entry.uri, { idempotent: true });
            this.cache.delete(key);
          } catch (error) {
            console.error('Failed to delete cache entry:', error);
          }
        }
      })
    );

    if (entriesToDelete.length > 0) {
      await this.saveCacheIndex();
    }
  }

  /**
   * Check cache size and clean if needed
   */
  private async checkCacheSize() {
    let totalSize = 0;
    const entries = Array.from(this.cache.entries());

    // Calculate total size
    entries.forEach(([_, entry]) => {
      totalSize += entry.size || 0;
    });

    if (totalSize > this.maxCacheSize) {
      // Sort by timestamp (LRU)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest entries until under limit
      let removed = 0;
      for (const [key, entry] of entries) {
        if (totalSize <= this.maxCacheSize) break;

        try {
          await FileSystem.deleteAsync(entry.uri, { idempotent: true });
          this.cache.delete(key);
          totalSize -= entry.size || 0;
          removed++;
        } catch (error) {
          console.error('Failed to remove cache entry:', error);
        }
      }

      if (removed > 0) {
        await this.saveCacheIndex();
      }
    }
  }

  /**
   * Clear entire cache
   */
  async clearCache() {
    if (Platform.OS === 'web') return;

    try {
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      this.cache.clear();
      await this.initializeCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    totalSize: number;
    oldestEntry: number;
  } {
    let totalSize = 0;
    let oldestTimestamp = Date.now();

    this.cache.forEach(entry => {
      totalSize += entry.size || 0;
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });

    return {
      entries: this.cache.size,
      totalSize,
      oldestEntry: oldestTimestamp,
    };
  }
}

// Singleton instance
export const imageOptimizer = new ImageOptimizer();

// Export convenience functions
export const getOptimizedImageUri = (uri: string) => imageOptimizer.getOptimizedUri(uri);
export const preloadImages = (uris: string[]) => imageOptimizer.preloadImages(uris);
export const clearImageCache = () => imageOptimizer.clearCache();
export const getImageCacheStats = () => imageOptimizer.getCacheStats();