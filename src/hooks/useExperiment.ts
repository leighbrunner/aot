import { useEffect, useState } from 'react';
import { abTesting } from '@/services/experiments/abTesting';

/**
 * Hook to get experiment variant
 */
export function useExperiment(experimentId: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperiment = async () => {
      try {
        const assignedVariant = abTesting.getVariant(experimentId);
        setVariant(assignedVariant);
        
        if (assignedVariant) {
          const variantConfig = abTesting.getVariantConfig(experimentId);
          setConfig(variantConfig);
        }
      } catch (error) {
        console.error('Failed to load experiment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiment();
  }, [experimentId]);

  return {
    variant,
    config,
    isLoading,
    isInExperiment: variant !== null,
    isControl: variant === 'control',
    isTreatment: variant !== null && variant !== 'control',
  };
}

/**
 * Hook to track experiment events
 */
export function useExperimentTracking() {
  const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
    try {
      await abTesting.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Failed to track experiment event:', error);
    }
  };

  return { trackEvent };
}

/**
 * Hook to get all active experiments for the user
 */
export function useActiveExperiments() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        const active = abTesting.getActiveExperiments();
        setExperiments(active);
      } catch (error) {
        console.error('Failed to load active experiments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiments();
  }, []);

  return { experiments, isLoading };
}

/**
 * Component wrapper for experiments
 */
interface ExperimentProps {
  experimentId: string;
  children: (variant: string, config: any) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function Experiment({ experimentId, children, fallback = null }: ExperimentProps) {
  const { variant, config, isLoading } = useExperiment(experimentId);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!variant) {
    return <>{fallback}</>;
  }

  return <>{children(variant, config)}</>;
}