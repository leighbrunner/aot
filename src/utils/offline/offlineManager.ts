import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

interface QueuedOperation {
  id: string;
  type: 'vote' | 'updateProfile' | 'custom';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

class OfflineManager {
  private operationQueue: QueuedOperation[] = [];
  private isOnline: boolean = true;
  private isProcessingQueue: boolean = false;
  private cachePrefix = '@voting_app_cache:';
  private queueKey = '@voting_app_queue';
  private maxRetries = 3;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize offline manager
   */
  private async initialize() {
    // Load queued operations
    await this.loadQueue();

    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));

      // Process queue when coming back online
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });

    // Check initial state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;

    // Process any pending operations
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribeToStatus(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Call immediately with current status
    listener(this.isOnline);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Queue an operation for later execution
   */
  async queueOperation(type: QueuedOperation['type'], data: any): Promise<void> {
    const operation: QueuedOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.operationQueue.push(operation);
    await this.saveQueue();

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue() {
    if (this.isProcessingQueue || !this.isOnline || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.operationQueue.length > 0 && this.isOnline) {
      const operation = this.operationQueue[0];

      try {
        await this.executeOperation(operation);
        
        // Remove successful operation
        this.operationQueue.shift();
        await this.saveQueue();
      } catch (error) {
        console.error('Failed to execute operation:', error);
        
        operation.retryCount++;
        
        if (operation.retryCount >= this.maxRetries) {
          // Remove failed operation after max retries
          this.operationQueue.shift();
          console.error('Operation failed after max retries:', operation);
        } else {
          // Move to end of queue
          this.operationQueue.push(this.operationQueue.shift()!);
        }
        
        await this.saveQueue();
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * operation.retryCount));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'vote':
        await client.models.Vote.create(operation.data);
        break;
        
      case 'updateProfile':
        await client.models.User.update(operation.data);
        break;
        
      case 'custom':
        // Execute custom operation
        if (operation.data.handler && typeof operation.data.handler === 'function') {
          await operation.data.handler(operation.data.params);
        }
        break;
        
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Cache data with expiration
   */
  async cacheData(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    const cached: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000),
    };

    try {
      await AsyncStorage.setItem(
        `${this.cachePrefix}${key}`,
        JSON.stringify(cached)
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.cachePrefix}${key}`);
      if (!cached) return null;

      const parsedCache: CachedData = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > parsedCache.expiresAt) {
        await AsyncStorage.removeItem(`${this.cachePrefix}${key}`);
        return null;
      }

      return parsedCache.data as T;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const parsedCache: CachedData = JSON.parse(cached);
          if (Date.now() > parsedCache.expiresAt) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(this.operationQueue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queue = await AsyncStorage.getItem(this.queueKey);
      if (queue) {
        this.operationQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    isOnline: boolean;
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queueLength: this.operationQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

// Export convenience functions
export const queueOperation = (type: QueuedOperation['type'], data: any) => 
  offlineManager.queueOperation(type, data);
export const cacheData = (key: string, data: any, ttlMinutes?: number) => 
  offlineManager.cacheData(key, data, ttlMinutes);
export const getCachedData = <T>(key: string) => 
  offlineManager.getCachedData<T>(key);
export const subscribeToOfflineStatus = (listener: (isOnline: boolean) => void) => 
  offlineManager.subscribeToStatus(listener);
export const getOfflineStatus = () => offlineManager.getQueueStatus();