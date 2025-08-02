interface PreloadOptions {
  priority?: 'low' | 'normal' | 'high';
  maxConcurrent?: number;
}

class ImagePreloader {
  private preloadQueue: Set<string> = new Set();
  private preloadedImages: Map<string, boolean> = new Map();
  private activePreloads: number = 0;
  private maxConcurrent: number = 3;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  /**
   * Preload a single image URL using browser Image API
   */
  async preloadImage(url: string, options?: PreloadOptions): Promise<void> {
    if (this.preloadedImages.has(url)) {
      return; // Already preloaded
    }

    return new Promise((resolve) => {
      const img = new Image();
      
      // Set loading priority if supported
      if ('loading' in img && options?.priority === 'low') {
        (img as any).loading = 'lazy';
      }
      
      img.onload = () => {
        this.preloadedImages.set(url, true);
        this.imageCache.set(url, img);
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
        this.preloadedImages.set(url, false);
        resolve();
      };
      
      // Set crossOrigin to avoid CORS issues
      img.crossOrigin = 'anonymous';
      
      // Start loading
      img.src = url;
    });
  }

  /**
   * Preload multiple images with concurrency control
   */
  async preloadImages(urls: string[], options?: PreloadOptions): Promise<void> {
    const maxConcurrent = options?.maxConcurrent || this.maxConcurrent;
    const uniqueUrls = [...new Set(urls)].filter(url => !this.preloadedImages.has(url));

    // Process images in batches
    for (let i = 0; i < uniqueUrls.length; i += maxConcurrent) {
      const batch = uniqueUrls.slice(i, i + maxConcurrent);
      await Promise.all(
        batch.map(url => this.preloadImage(url, options))
      );
    }
  }

  /**
   * Add images to preload queue for background loading
   */
  queuePreload(urls: string | string[]): void {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    urlArray.forEach(url => {
      if (!this.preloadedImages.has(url)) {
        this.preloadQueue.add(url);
      }
    });
    
    // Process queue in background
    this.processQueue();
  }

  /**
   * Process preload queue in background
   */
  private async processQueue(): Promise<void> {
    if (this.activePreloads >= this.maxConcurrent || this.preloadQueue.size === 0) {
      return;
    }

    const urlsToPreload = Array.from(this.preloadQueue).slice(0, this.maxConcurrent - this.activePreloads);
    urlsToPreload.forEach(url => this.preloadQueue.delete(url));

    this.activePreloads += urlsToPreload.length;

    try {
      await Promise.all(
        urlsToPreload.map(url => 
          this.preloadImage(url, { priority: 'low' })
        )
      );
    } finally {
      this.activePreloads -= urlsToPreload.length;
      
      // Continue processing if there are more items
      if (this.preloadQueue.size > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Preload images using link prefetch (for better browser optimization)
   */
  prefetchImages(urls: string[]): void {
    urls.forEach(url => {
      if (this.preloadedImages.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Clear preload cache
   */
  clearCache(): void {
    this.preloadedImages.clear();
    this.preloadQueue.clear();
    this.imageCache.clear();
  }

  /**
   * Get preload statistics
   */
  getStats(): {
    totalPreloaded: number;
    successfulPreloads: number;
    failedPreloads: number;
    queueSize: number;
    activePreloads: number;
  } {
    const successful = Array.from(this.preloadedImages.values()).filter(v => v).length;
    const failed = this.preloadedImages.size - successful;

    return {
      totalPreloaded: this.preloadedImages.size,
      successfulPreloads: successful,
      failedPreloads: failed,
      queueSize: this.preloadQueue.size,
      activePreloads: this.activePreloads,
    };
  }

  /**
   * Check if an image is already preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedImages.get(url) === true;
  }

  /**
   * Get cached image element if available
   */
  getCachedImage(url: string): HTMLImageElement | undefined {
    return this.imageCache.get(url);
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloader();

// Export hook for React components
export function useImagePreloader() {
  return {
    preloadImage: (url: string, options?: PreloadOptions) => 
      imagePreloader.preloadImage(url, options),
    preloadImages: (urls: string[], options?: PreloadOptions) => 
      imagePreloader.preloadImages(urls, options),
    queuePreload: (urls: string | string[]) => 
      imagePreloader.queuePreload(urls),
    prefetchImages: (urls: string[]) => 
      imagePreloader.prefetchImages(urls),
    isPreloaded: (url: string) => 
      imagePreloader.isPreloaded(url),
    getCachedImage: (url: string) => 
      imagePreloader.getCachedImage(url),
    getStats: () => 
      imagePreloader.getStats(),
  };
}