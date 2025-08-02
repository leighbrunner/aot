import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/data';
import { errorTracker } from '../monitoring/errorTracking';

const FEATURE_FLAGS_KEY = '@voting_app_feature_flags';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  targetGroups?: string[];
  metadata?: Record<string, any>;
  expiresAt?: string;
}

interface FeatureFlagCache {
  flags: Record<string, FeatureFlag>;
  timestamp: number;
}

class FeatureFlagsService {
  private client = generateClient();
  private cache: FeatureFlagCache | null = null;
  private userId?: string;
  private userGroups: string[] = [];
  private overrides: Record<string, boolean> = {};
  private listeners: Map<string, Set<(enabled: boolean) => void>> = new Map();

  /**
   * Initialize feature flags
   */
  async initialize(userId?: string, userGroups?: string[]) {
    this.userId = userId;
    this.userGroups = userGroups || [];
    
    // Load cached flags
    await this.loadCachedFlags();
    
    // Fetch latest flags
    await this.fetchFlags();
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(featureKey: string): boolean {
    // Check overrides first
    if (featureKey in this.overrides) {
      return this.overrides[featureKey];
    }

    const flag = this.cache?.flags[featureKey];
    if (!flag) {
      // Feature not found, default to disabled
      return false;
    }

    // Check if flag has expired
    if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) {
      return false;
    }

    // Check target groups
    if (flag.targetGroups && flag.targetGroups.length > 0) {
      const hasTargetGroup = flag.targetGroups.some(group => 
        this.userGroups.includes(group)
      );
      if (!hasTargetGroup) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const userHash = this.hashUserId(this.userId || 'anonymous', featureKey);
      const threshold = flag.rolloutPercentage / 100;
      return userHash < threshold;
    }

    return flag.enabled;
  }

  /**
   * Get feature flag value with metadata
   */
  getFeature(featureKey: string): FeatureFlag | null {
    return this.cache?.flags[featureKey] || null;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): Record<string, FeatureFlag> {
    return this.cache?.flags || {};
  }

  /**
   * Subscribe to feature flag changes
   */
  subscribe(featureKey: string, callback: (enabled: boolean) => void): () => void {
    if (!this.listeners.has(featureKey)) {
      this.listeners.set(featureKey, new Set());
    }
    
    this.listeners.get(featureKey)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(featureKey)?.delete(callback);
    };
  }

  /**
   * Override a feature flag (for testing)
   */
  override(featureKey: string, enabled: boolean) {
    this.overrides[featureKey] = enabled;
    this.notifyListeners(featureKey, enabled);
  }

  /**
   * Clear override
   */
  clearOverride(featureKey: string) {
    delete this.overrides[featureKey];
    const enabled = this.isEnabled(featureKey);
    this.notifyListeners(featureKey, enabled);
  }

  /**
   * Clear all overrides
   */
  clearAllOverrides() {
    const keys = Object.keys(this.overrides);
    this.overrides = {};
    keys.forEach(key => {
      const enabled = this.isEnabled(key);
      this.notifyListeners(key, enabled);
    });
  }

  /**
   * Fetch flags from backend
   */
  private async fetchFlags() {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll use hardcoded flags
      const flags: Record<string, FeatureFlag> = {
        'new_voting_ui': {
          key: 'new_voting_ui',
          enabled: true,
          rolloutPercentage: 50,
        },
        'social_sharing': {
          key: 'social_sharing',
          enabled: false,
        },
        'premium_features': {
          key: 'premium_features',
          enabled: true,
          targetGroups: ['premium', 'beta'],
        },
        'ai_recommendations': {
          key: 'ai_recommendations',
          enabled: true,
          rolloutPercentage: 20,
        },
        'offline_mode': {
          key: 'offline_mode',
          enabled: true,
        },
        'advanced_analytics': {
          key: 'advanced_analytics',
          enabled: false,
          targetGroups: ['admin'],
        },
        'push_notifications': {
          key: 'push_notifications',
          enabled: true,
          rolloutPercentage: 80,
        },
        'dark_mode': {
          key: 'dark_mode',
          enabled: true,
        },
        'image_filters': {
          key: 'image_filters',
          enabled: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        },
      };

      // Update cache
      this.cache = {
        flags,
        timestamp: Date.now(),
      };

      // Save to local storage
      await this.saveCachedFlags();

      // Notify listeners of any changes
      Object.keys(flags).forEach(key => {
        const enabled = this.isEnabled(key);
        this.notifyListeners(key, enabled);
      });
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'fetch_feature_flags',
      });
    }
  }

  /**
   * Load cached flags from storage
   */
  private async loadCachedFlags() {
    try {
      const cached = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        
        // Check if cache is expired
        if (this.cache && Date.now() - this.cache.timestamp > CACHE_DURATION) {
          this.cache = null;
        }
      }
    } catch (error) {
      console.error('Failed to load cached feature flags:', error);
    }
  }

  /**
   * Save flags to cache
   */
  private async saveCachedFlags() {
    try {
      if (this.cache) {
        await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(this.cache));
      }
    } catch (error) {
      console.error('Failed to save feature flags to cache:', error);
    }
  }

  /**
   * Hash user ID for consistent rollout
   */
  private hashUserId(userId: string, featureKey: string): number {
    const str = `${userId}:${featureKey}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to 0-1 range
    return Math.abs(hash) / 2147483647;
  }

  /**
   * Notify listeners of feature flag changes
   */
  private notifyListeners(featureKey: string, enabled: boolean) {
    this.listeners.get(featureKey)?.forEach(callback => {
      try {
        callback(enabled);
      } catch (error) {
        console.error('Error in feature flag listener:', error);
      }
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureKey: string, metadata?: Record<string, any>) {
    if (this.isEnabled(featureKey)) {
      errorTracker.trackEvent('feature_used', {
        feature: featureKey,
        userId: this.userId,
        ...metadata,
      });
    }
  }

  /**
   * Get feature flags for debugging
   */
  getDebugInfo() {
    return {
      userId: this.userId,
      userGroups: this.userGroups,
      overrides: this.overrides,
      cache: this.cache,
      flags: Object.keys(this.cache?.flags || {}).reduce((acc, key) => {
        acc[key] = this.isEnabled(key);
        return acc;
      }, {} as Record<string, boolean>),
    };
  }
}

export const featureFlags = new FeatureFlagsService();