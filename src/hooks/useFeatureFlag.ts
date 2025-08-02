import { useEffect, useState } from 'react';
import { featureFlags } from '@/services/features/featureFlags';

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(featureKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState(() => 
    featureFlags.isEnabled(featureKey)
  );

  useEffect(() => {
    // Check current state
    setIsEnabled(featureFlags.isEnabled(featureKey));

    // Subscribe to changes
    const unsubscribe = featureFlags.subscribe(featureKey, (enabled) => {
      setIsEnabled(enabled);
    });

    return unsubscribe;
  }, [featureKey]);

  return isEnabled;
}

/**
 * Hook to get feature flag with metadata
 */
export function useFeature(featureKey: string) {
  const [feature, setFeature] = useState(() => 
    featureFlags.getFeature(featureKey)
  );
  const [isEnabled, setIsEnabled] = useState(() => 
    featureFlags.isEnabled(featureKey)
  );

  useEffect(() => {
    // Check current state
    setFeature(featureFlags.getFeature(featureKey));
    setIsEnabled(featureFlags.isEnabled(featureKey));

    // Subscribe to changes
    const unsubscribe = featureFlags.subscribe(featureKey, (enabled) => {
      setIsEnabled(enabled);
      setFeature(featureFlags.getFeature(featureKey));
    });

    return unsubscribe;
  }, [featureKey]);

  return { feature, isEnabled };
}

/**
 * Hook to get all feature flags
 */
export function useAllFeatureFlags() {
  const [flags, setFlags] = useState(() => {
    const allFlags = featureFlags.getAllFlags();
    return Object.keys(allFlags).reduce((acc, key) => {
      acc[key] = featureFlags.isEnabled(key);
      return acc;
    }, {} as Record<string, boolean>);
  });

  useEffect(() => {
    const updateFlags = () => {
      const allFlags = featureFlags.getAllFlags();
      const enabledFlags = Object.keys(allFlags).reduce((acc, key) => {
        acc[key] = featureFlags.isEnabled(key);
        return acc;
      }, {} as Record<string, boolean>);
      setFlags(enabledFlags);
    };

    // Subscribe to all flags
    const unsubscribes: (() => void)[] = [];
    const allFlags = featureFlags.getAllFlags();
    
    Object.keys(allFlags).forEach(key => {
      const unsubscribe = featureFlags.subscribe(key, () => {
        updateFlags();
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  return flags;
}

/**
 * Component wrapper for feature flags
 */
interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag);
  return <>{isEnabled ? children : fallback}</>;
}