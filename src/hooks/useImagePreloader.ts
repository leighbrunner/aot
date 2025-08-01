import { useEffect, useRef } from 'react';
import { imageOptimizer } from '../utils/imageOptimization';
import { useNetInfo } from '@react-native-community/netinfo';

interface UseImagePreloaderOptions {
  preloadCount?: number;
  priorityThreshold?: number;
}

export const useImagePreloader = (
  imageUrls: string[],
  options: UseImagePreloaderOptions = {}
) => {
  const { preloadCount = 3, priorityThreshold = 5 } = options;
  const netInfo = useNetInfo();
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!imageUrls.length) return;

    // Don't preload on cellular if user has limited data
    if (netInfo.type === 'cellular' && netInfo.details?.isConnectionExpensive) {
      return;
    }

    // Determine how many images to preload based on connection
    const imagesToPreload = netInfo.type === 'wifi' 
      ? Math.min(preloadCount * 2, imageUrls.length)
      : Math.min(preloadCount, imageUrls.length);

    // Filter out already preloaded images
    const newImagesToPreload = imageUrls
      .slice(0, imagesToPreload)
      .filter(url => !preloadedUrlsRef.current.has(url));

    if (newImagesToPreload.length > 0) {
      // Preload images
      imageOptimizer.preloadImages(newImagesToPreload).then(() => {
        // Mark as preloaded
        newImagesToPreload.forEach(url => {
          preloadedUrlsRef.current.add(url);
        });
      });
    }

    // Clean up old preloaded URLs to prevent memory leaks
    if (preloadedUrlsRef.current.size > priorityThreshold * 2) {
      const urlsArray = Array.from(preloadedUrlsRef.current);
      const urlsToKeep = new Set(urlsArray.slice(-priorityThreshold));
      preloadedUrlsRef.current = urlsToKeep;
    }
  }, [imageUrls, netInfo.type, preloadCount, priorityThreshold]);

  // Clear preloaded images on unmount
  useEffect(() => {
    return () => {
      preloadedUrlsRef.current.clear();
    };
  }, []);

  return {
    preloadedCount: preloadedUrlsRef.current.size,
    isPreloading: false, // Could be enhanced with loading state
  };
};