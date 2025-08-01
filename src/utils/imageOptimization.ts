import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import FastImage from 'react-native-fast-image';

interface ImageCacheConfig {
  maxCacheSize: number; // in MB
  maxCacheAge: number; // in days
  preloadCount: number; // number of images to preload
}

const DEFAULT_CONFIG: ImageCacheConfig = {
  maxCacheSize: 100, // 100MB
  maxCacheAge: 7, // 7 days
  preloadCount: 3, // preload next 3 image pairs
};

class ImageOptimizationManager {
  private config: ImageCacheConfig;
  private cacheKeyPrefix = '@image_cache:';
  private metadataKey = '@image_cache_metadata';

  constructor(config: Partial<ImageCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      await this.cleanExpiredCache();
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Preload images for faster rendering
   */
  async preloadImages(urls: string[]): Promise<void> {
    const imagesToPreload = urls.slice(0, this.config.preloadCount);
    
    // Use FastImage for preloading with priority
    const preloadTasks = imagesToPreload.map((url, index) => 
      FastImage.preload([
        {
          uri: url,
          priority: index === 0 ? FastImage.priority.high : FastImage.priority.normal,
        },
      ])
    );

    try {
      await Promise.all(preloadTasks);
      await this.updateCacheMetadata(imagesToPreload);
    } catch (error) {
      console.error('Failed to preload images:', error);
    }
  }

  /**
   * Get optimized image URL based on network conditions
   */
  getOptimizedImageUrl(
    originalUrl: string,
    size: 'thumbnail' | 'medium' | 'full',
    networkType?: string
  ): string {
    // CloudFront URL transformations
    const baseUrl = originalUrl.split('?')[0];
    const extension = baseUrl.split('.').pop();
    
    // Size mappings
    const sizeParams = {
      thumbnail: 'w=150,h=150,q=70',
      medium: 'w=600,h=600,q=80',
      full: 'w=1200,h=1200,q=90',
    };

    // Adjust quality based on network
    let quality = sizeParams[size];
    if (networkType === 'cellular') {
      quality = quality.replace(/q=\d+/, 'q=60');
    }

    // Return CloudFront optimized URL
    return `${baseUrl}?${quality}&f=auto`;
  }

  /**
   * Clear image cache based on size or age
   */
  private async cleanExpiredCache(): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const now = Date.now();
      const maxAge = this.config.maxCacheAge * 24 * 60 * 60 * 1000;

      const updatedMetadata = metadata.filter(
        (item) => now - item.timestamp < maxAge
      );

      await this.saveCacheMetadata(updatedMetadata);

      // Clear FastImage cache if needed
      if (metadata.length !== updatedMetadata.length) {
        FastImage.clearDiskCache();
      }
    } catch (error) {
      console.error('Failed to clean cache:', error);
    }
  }

  /**
   * Get cache metadata
   */
  private async getCacheMetadata(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.metadataKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save cache metadata
   */
  private async saveCacheMetadata(metadata: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  /**
   * Update cache metadata with new images
   */
  private async updateCacheMetadata(urls: string[]): Promise<void> {
    const metadata = await this.getCacheMetadata();
    const now = Date.now();

    const newEntries = urls.map((url) => ({
      url,
      timestamp: now,
    }));

    const updatedMetadata = [...metadata, ...newEntries];
    await this.saveCacheMetadata(updatedMetadata);
  }

  /**
   * Clear all image cache
   */
  async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.metadataKey);
      await FastImage.clearDiskCache();
      await FastImage.clearMemoryCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size estimate
   */
  async getCacheSize(): Promise<number> {
    const metadata = await this.getCacheMetadata();
    // Rough estimate: 500KB per image average
    return metadata.length * 0.5;
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizationManager();

// Export image loading priorities
export const ImagePriority = {
  HIGH: FastImage.priority.high,
  NORMAL: FastImage.priority.normal,
  LOW: FastImage.priority.low,
};

// Export optimized image component
export { FastImage as OptimizedImage };