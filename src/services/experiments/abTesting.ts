import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/data';
import { errorTracker } from '../monitoring/errorTracking';
import { featureFlags } from '../features/featureFlags';

const EXPERIMENTS_KEY = '@voting_app_experiments';
const EXPERIMENT_ASSIGNMENTS_KEY = '@voting_app_experiment_assignments';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  targetAudience?: {
    segments?: string[];
    percentage?: number;
    filters?: Record<string, any>;
  };
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  minimumSampleSize?: number;
  confidenceLevel?: number;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description?: string;
  weight: number; // 0-100, must sum to 100 across all variants
  config: Record<string, any>;
  isControl?: boolean;
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'numeric' | 'duration' | 'count';
  goalDirection: 'increase' | 'decrease';
  primaryMetric?: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: string;
  userId: string;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metrics: Record<string, MetricResult>;
  sampleSize: number;
  confidence?: number;
  isSignificant?: boolean;
}

export interface MetricResult {
  value: number;
  baseline?: number;
  change?: number;
  confidence?: number;
  pValue?: number;
}

class ABTestingService {
  private client = generateClient();
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment> = new Map();
  private userId?: string;
  private userSegments: string[] = [];
  private eventQueue: any[] = [];

  /**
   * Initialize A/B testing service
   */
  async initialize(userId: string, userSegments?: string[]) {
    this.userId = userId;
    this.userSegments = userSegments || [];
    
    // Load experiments and assignments
    await this.loadExperiments();
    await this.loadAssignments();
    
    // Process any queued events
    await this.processEventQueue();
  }

  /**
   * Get variant assignment for an experiment
   */
  getVariant(experimentId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if already assigned
    const existingAssignment = this.assignments.get(experimentId);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // Check if user qualifies for experiment
    if (!this.isUserQualified(experiment)) {
      return null;
    }

    // Assign variant
    const variant = this.assignVariant(experiment);
    if (variant) {
      this.saveAssignment(experimentId, variant.id);
      return variant.id;
    }

    return null;
  }

  /**
   * Get variant configuration
   */
  getVariantConfig(experimentId: string): Record<string, any> | null {
    const variantId = this.getVariant(experimentId);
    if (!variantId) {
      return null;
    }

    const experiment = this.experiments.get(experimentId);
    const variant = experiment?.variants.find(v => v.id === variantId);
    return variant?.config || null;
  }

  /**
   * Track experiment event
   */
  async trackEvent(eventName: string, properties?: Record<string, any>) {
    try {
      // Get all active experiment assignments
      const activeAssignments = Array.from(this.assignments.entries())
        .filter(([expId]) => {
          const exp = this.experiments.get(expId);
          return exp && exp.status === 'running';
        });

      // Track event for each active experiment
      for (const [experimentId, assignment] of activeAssignments) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) continue;

        // Check if event is relevant to experiment metrics
        const relevantMetrics = experiment.metrics.filter(m => 
          this.isEventRelevantToMetric(eventName, m)
        );

        if (relevantMetrics.length > 0) {
          await this.sendExperimentEvent({
            experimentId,
            variantId: assignment.variantId,
            userId: this.userId!,
            eventName,
            properties,
            metrics: relevantMetrics.map(m => m.id),
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'track_experiment_event',
        eventName,
      });
    }
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    try {
      // In production, this would fetch from your analytics backend
      const experiment = this.experiments.get(experimentId);
      if (!experiment) {
        return [];
      }

      // Mock results for now
      return experiment.variants.map(variant => ({
        experimentId,
        variantId: variant.id,
        metrics: {
          conversion: {
            value: Math.random() * 0.1 + (variant.isControl ? 0.05 : 0.06),
            baseline: 0.05,
            change: variant.isControl ? 0 : 0.2,
            confidence: 0.95,
            pValue: variant.isControl ? 1 : 0.03,
          },
        },
        sampleSize: Math.floor(Math.random() * 10000) + 1000,
        confidence: 0.95,
        isSignificant: !variant.isControl,
      }));
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'get_experiment_results',
        experimentId,
      });
      return [];
    }
  }

  /**
   * Check if experiment has reached statistical significance
   */
  async checkSignificance(experimentId: string): Promise<boolean> {
    const results = await this.getExperimentResults(experimentId);
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment || results.length < 2) {
      return false;
    }

    // Check minimum sample size
    const totalSample = results.reduce((sum, r) => sum + r.sampleSize, 0);
    if (experiment.minimumSampleSize && totalSample < experiment.minimumSampleSize) {
      return false;
    }

    // Check if any variant has significant results
    return results.some(r => r.isSignificant === true);
  }

  /**
   * Complete an experiment
   */
  async completeExperiment(experimentId: string, winningVariantId?: string) {
    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Update experiment status
      experiment.status = 'completed';
      experiment.endDate = new Date().toISOString();

      // If winning variant specified, update feature flags
      if (winningVariantId) {
        const winningVariant = experiment.variants.find(v => v.id === winningVariantId);
        if (winningVariant) {
          // Apply winning variant config to feature flags
          Object.entries(winningVariant.config).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
              featureFlags.override(key, value);
            }
          });
        }
      }

      // Save updated experiment
      await this.saveExperiments();

      // Track completion
      errorTracker.trackEvent('experiment_completed', {
        experimentId,
        winningVariantId,
      });
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'complete_experiment',
        experimentId,
      });
    }
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get active experiments for user
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running' && this.isUserQualified(exp));
  }

  /**
   * Get user's experiment assignments
   */
  getUserAssignments(): ExperimentAssignment[] {
    return Array.from(this.assignments.values());
  }

  // Private methods

  private async loadExperiments() {
    try {
      // In production, fetch from API
      // For now, use hardcoded experiments
      const experiments: Experiment[] = [
        {
          id: 'new_voting_ui_test',
          name: 'New Voting UI Test',
          description: 'Test new swipe-based voting interface',
          status: 'running',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          targetAudience: {
            percentage: 50,
          },
          variants: [
            {
              id: 'control',
              name: 'Current UI',
              weight: 50,
              config: { useNewVotingUI: false },
              isControl: true,
            },
            {
              id: 'treatment',
              name: 'New Swipe UI',
              weight: 50,
              config: { useNewVotingUI: true },
            },
          ],
          metrics: [
            {
              id: 'voting_rate',
              name: 'Voting Rate',
              type: 'conversion',
              goalDirection: 'increase',
              primaryMetric: true,
            },
            {
              id: 'session_duration',
              name: 'Session Duration',
              type: 'duration',
              goalDirection: 'increase',
            },
          ],
          minimumSampleSize: 1000,
          confidenceLevel: 0.95,
        },
        {
          id: 'onboarding_flow',
          name: 'Onboarding Flow Optimization',
          description: 'Test simplified onboarding process',
          status: 'running',
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          targetAudience: {
            segments: ['new_users'],
          },
          variants: [
            {
              id: 'control',
              name: 'Current Onboarding',
              weight: 33,
              config: { onboardingSteps: 5 },
              isControl: true,
            },
            {
              id: 'variant_a',
              name: 'Simplified (3 steps)',
              weight: 33,
              config: { onboardingSteps: 3 },
            },
            {
              id: 'variant_b',
              name: 'Skip Option',
              weight: 34,
              config: { onboardingSteps: 5, allowSkip: true },
            },
          ],
          metrics: [
            {
              id: 'onboarding_completion',
              name: 'Onboarding Completion',
              type: 'conversion',
              goalDirection: 'increase',
              primaryMetric: true,
            },
            {
              id: 'first_vote',
              name: 'First Vote Conversion',
              type: 'conversion',
              goalDirection: 'increase',
            },
          ],
          minimumSampleSize: 500,
          confidenceLevel: 0.95,
        },
      ];

      experiments.forEach(exp => {
        this.experiments.set(exp.id, exp);
      });
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  private async loadAssignments() {
    try {
      const stored = await AsyncStorage.getItem(EXPERIMENT_ASSIGNMENTS_KEY);
      if (stored) {
        const assignments: ExperimentAssignment[] = JSON.parse(stored);
        assignments
          .filter(a => a.userId === this.userId)
          .forEach(a => {
            this.assignments.set(a.experimentId, a);
          });
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  }

  private async saveAssignments() {
    try {
      const allAssignments = Array.from(this.assignments.values());
      await AsyncStorage.setItem(
        EXPERIMENT_ASSIGNMENTS_KEY,
        JSON.stringify(allAssignments)
      );
    } catch (error) {
      console.error('Failed to save assignments:', error);
    }
  }

  private async saveExperiments() {
    try {
      const allExperiments = Array.from(this.experiments.values());
      await AsyncStorage.setItem(
        EXPERIMENTS_KEY,
        JSON.stringify(allExperiments)
      );
    } catch (error) {
      console.error('Failed to save experiments:', error);
    }
  }

  private isUserQualified(experiment: Experiment): boolean {
    if (!experiment.targetAudience) {
      return true;
    }

    const { segments, percentage, filters } = experiment.targetAudience;

    // Check segments
    if (segments && segments.length > 0) {
      const hasSegment = segments.some(seg => this.userSegments.includes(seg));
      if (!hasSegment) {
        return false;
      }
    }

    // Check percentage rollout
    if (percentage && percentage < 100) {
      const hash = this.hashString(`${this.userId}:${experiment.id}`);
      const threshold = percentage / 100;
      if (hash > threshold) {
        return false;
      }
    }

    // Check custom filters
    if (filters) {
      // Implement custom filter logic based on your requirements
    }

    return true;
  }

  private assignVariant(experiment: Experiment): ExperimentVariant | null {
    const hash = this.hashString(`${this.userId}:${experiment.id}:variant`);
    const scaledHash = hash * 100;

    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (scaledHash <= cumulativeWeight) {
        return variant;
      }
    }

    return experiment.variants[0] || null;
  }

  private saveAssignment(experimentId: string, variantId: string) {
    const assignment: ExperimentAssignment = {
      experimentId,
      variantId,
      assignedAt: new Date().toISOString(),
      userId: this.userId!,
    };

    this.assignments.set(experimentId, assignment);
    this.saveAssignments();

    // Track assignment
    errorTracker.trackEvent('experiment_assigned', {
      experimentId,
      variantId,
      userId: this.userId,
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  }

  private isEventRelevantToMetric(eventName: string, metric: ExperimentMetric): boolean {
    // Map common events to metrics
    const eventMetricMap: Record<string, string[]> = {
      'vote_submitted': ['voting_rate', 'engagement'],
      'session_end': ['session_duration', 'retention'],
      'onboarding_complete': ['onboarding_completion'],
      'first_vote': ['first_vote', 'activation'],
      'share_tapped': ['viral_coefficient', 'sharing_rate'],
    };

    const relevantMetrics = eventMetricMap[eventName] || [];
    return relevantMetrics.includes(metric.id);
  }

  private async sendExperimentEvent(event: any) {
    try {
      // In production, send to analytics backend
      this.eventQueue.push(event);
      
      // Batch send events
      if (this.eventQueue.length >= 10) {
        await this.flushEventQueue();
      }
    } catch (error) {
      console.error('Failed to send experiment event:', error);
    }
  }

  private async processEventQueue() {
    if (this.eventQueue.length > 0) {
      await this.flushEventQueue();
    }
  }

  private async flushEventQueue() {
    if (this.eventQueue.length === 0) return;

    try {
      // In production, batch send to analytics API
      console.log('Flushing experiment events:', this.eventQueue.length);
      this.eventQueue = [];
    } catch (error) {
      console.error('Failed to flush event queue:', error);
    }
  }
}

export const abTesting = new ABTestingService();