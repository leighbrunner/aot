import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { errorTracker } from '../monitoring/errorTracking';
import { featureFlags } from '../features/featureFlags';
import { generateClient } from 'aws-amplify/data';

const BETA_STATUS_KEY = '@voting_app_beta_status';
const BETA_FEEDBACK_KEY = '@voting_app_beta_feedback';

export interface BetaTester {
  userId: string;
  email: string;
  joinedAt: string;
  platform: string;
  appVersion: string;
  buildNumber: string;
  deviceInfo: {
    model: string;
    os: string;
    osVersion: string;
  };
  feedbackCount: number;
  lastActiveAt: string;
}

export interface BetaFeedback {
  id: string;
  userId: string;
  timestamp: string;
  type: 'bug' | 'feature' | 'performance' | 'ui' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  screenshots?: string[];
  deviceInfo: any;
  appState: any;
  status: 'pending' | 'reviewed' | 'fixed' | 'wontfix';
}

export interface BetaUpdate {
  version: string;
  releaseNotes: string;
  timestamp: string;
  features: string[];
  fixes: string[];
  knownIssues: string[];
  isMandatory: boolean;
}

class BetaTestingService {
  private client = generateClient();
  private isBetaTester: boolean = false;
  private betaInfo: BetaTester | null = null;
  private pendingFeedback: BetaFeedback[] = [];

  /**
   * Initialize beta testing service
   */
  async initialize(userId: string) {
    try {
      // Check if user is a beta tester
      await this.checkBetaStatus(userId);
      
      // Load pending feedback
      await this.loadPendingFeedback();
      
      // If beta tester, enable beta features
      if (this.isBetaTester) {
        await this.enableBetaFeatures();
        await this.registerBetaTester(userId);
      }
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'initialize_beta_testing',
        userId,
      });
    }
  }

  /**
   * Check if user is enrolled in beta program
   */
  async checkBetaStatus(userId: string): Promise<boolean> {
    try {
      // Check local storage first
      const cachedStatus = await AsyncStorage.getItem(BETA_STATUS_KEY);
      if (cachedStatus) {
        const status = JSON.parse(cachedStatus);
        if (status.userId === userId && status.expiresAt > Date.now()) {
          this.isBetaTester = status.isBeta;
          return status.isBeta;
        }
      }

      // Check with backend
      // In production, this would query your beta tester database
      const isBeta = await this.checkBetaStatusFromBackend(userId);
      
      // Cache the result
      await AsyncStorage.setItem(BETA_STATUS_KEY, JSON.stringify({
        userId,
        isBeta,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }));

      this.isBetaTester = isBeta;
      return isBeta;
    } catch (error) {
      console.error('Failed to check beta status:', error);
      return false;
    }
  }

  /**
   * Enroll user in beta program
   */
  async enrollInBeta(userId: string, inviteCode?: string): Promise<boolean> {
    try {
      // Validate invite code if provided
      if (inviteCode) {
        const isValid = await this.validateInviteCode(inviteCode);
        if (!isValid) {
          throw new Error('Invalid invite code');
        }
      }

      // Register as beta tester
      await this.registerBetaTester(userId);
      
      // Update local status
      this.isBetaTester = true;
      await AsyncStorage.setItem(BETA_STATUS_KEY, JSON.stringify({
        userId,
        isBeta: true,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }));

      // Enable beta features
      await this.enableBetaFeatures();

      // Track enrollment
      errorTracker.trackEvent('beta_enrolled', {
        userId,
        inviteCode: !!inviteCode,
      });

      return true;
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'enroll_in_beta',
        userId,
      });
      return false;
    }
  }

  /**
   * Leave beta program
   */
  async leaveBeta(userId: string, reason?: string): Promise<void> {
    try {
      // Submit exit feedback
      if (reason) {
        await this.submitFeedback({
          id: `exit_${Date.now()}`,
          userId,
          timestamp: new Date().toISOString(),
          type: 'other',
          severity: 'low',
          title: 'Beta Exit Feedback',
          description: reason,
          deviceInfo: await this.getDeviceInfo(),
          appState: {},
          status: 'pending',
        });
      }

      // Remove from beta testers
      await this.removeBetaTester(userId);

      // Clear local status
      this.isBetaTester = false;
      await AsyncStorage.removeItem(BETA_STATUS_KEY);

      // Disable beta features
      await this.disableBetaFeatures();

      // Track exit
      errorTracker.trackEvent('beta_exited', {
        userId,
        hasReason: !!reason,
      });
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'leave_beta',
        userId,
      });
    }
  }

  /**
   * Submit beta feedback
   */
  async submitFeedback(feedback: Omit<BetaFeedback, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullFeedback: BetaFeedback = {
        ...feedback,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        deviceInfo: await this.getDeviceInfo(),
        appState: await this.getAppState(),
      };

      // Try to submit to backend
      try {
        await this.submitFeedbackToBackend(fullFeedback);
      } catch (error) {
        // If submission fails, queue for later
        this.pendingFeedback.push(fullFeedback);
        await this.savePendingFeedback();
      }

      // Track feedback submission
      errorTracker.trackEvent('beta_feedback_submitted', {
        type: feedback.type,
        severity: feedback.severity,
      });
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'submit_beta_feedback',
      });
    }
  }

  /**
   * Check for beta updates
   */
  async checkForUpdates(): Promise<BetaUpdate | null> {
    if (!this.isBetaTester) {
      return null;
    }

    try {
      // Check if using Expo Updates
      if (!__DEV__ && Updates.isEnabled) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          // Fetch update manifest for beta channel
          const manifest = update.manifest as any;
          return {
            version: manifest.version || 'Unknown',
            releaseNotes: manifest.releaseNotes || 'Beta update available',
            timestamp: new Date().toISOString(),
            features: manifest.features || [],
            fixes: manifest.fixes || [],
            knownIssues: manifest.knownIssues || [],
            isMandatory: manifest.isMandatory || false,
          };
        }
      }

      return null;
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'check_beta_updates',
      });
      return null;
    }
  }

  /**
   * Apply beta update
   */
  async applyUpdate(): Promise<void> {
    if (!this.isBetaTester) {
      throw new Error('Not a beta tester');
    }

    try {
      if (!__DEV__ && Updates.isEnabled) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'apply_beta_update',
      });
      throw error;
    }
  }

  /**
   * Get beta testing stats
   */
  async getBetaStats() {
    if (!this.isBetaTester) {
      return null;
    }

    try {
      const feedbackCount = await this.getFeedbackCount();
      const lastUpdate = await this.getLastUpdateInfo();
      const activeTesters = await this.getActiveTesterCount();

      return {
        feedbackSubmitted: feedbackCount,
        lastUpdate,
        activeTesters,
        currentVersion: Updates.manifest?.version || 'Unknown',
        isUpdateAvailable: await this.checkForUpdates() !== null,
      };
    } catch (error) {
      errorTracker.logError(error as Error, {
        action: 'get_beta_stats',
      });
      return null;
    }
  }

  /**
   * Get beta tester info
   */
  getBetaTesterInfo(): BetaTester | null {
    return this.betaInfo;
  }

  /**
   * Check if user is beta tester
   */
  getIsBetaTester(): boolean {
    return this.isBetaTester;
  }

  // Private methods

  private async checkBetaStatusFromBackend(userId: string): Promise<boolean> {
    // In production, this would query your beta tester database
    // For now, return true for specific test users
    const betaTesters = ['beta1', 'beta2', 'beta3'];
    return betaTesters.includes(userId);
  }

  private async validateInviteCode(code: string): Promise<boolean> {
    // In production, validate against your invite code database
    const validCodes = ['BETA2024', 'EARLYACCESS', 'VOTINGBETA'];
    return validCodes.includes(code.toUpperCase());
  }

  private async registerBetaTester(userId: string): Promise<void> {
    const deviceInfo = await this.getDeviceInfo();
    
    this.betaInfo = {
      userId,
      email: '', // Would be fetched from user profile
      joinedAt: new Date().toISOString(),
      platform: Platform.OS,
      appVersion: Updates.manifest?.version || 'Unknown',
      buildNumber: Updates.manifest?.ios?.buildNumber || Updates.manifest?.android?.versionCode || 'Unknown',
      deviceInfo,
      feedbackCount: 0,
      lastActiveAt: new Date().toISOString(),
    };

    // In production, save to backend
  }

  private async removeBetaTester(userId: string): Promise<void> {
    // In production, remove from backend
    this.betaInfo = null;
  }

  private async enableBetaFeatures(): Promise<void> {
    // Enable beta-specific feature flags
    featureFlags.override('beta_features', true);
    featureFlags.override('experimental_ui', true);
    featureFlags.override('debug_mode', true);
    
    // Add user to beta group for feature targeting
    await featureFlags.initialize(this.betaInfo?.userId, ['beta']);
  }

  private async disableBetaFeatures(): Promise<void> {
    // Clear beta overrides
    featureFlags.clearOverride('beta_features');
    featureFlags.clearOverride('experimental_ui');
    featureFlags.clearOverride('debug_mode');
  }

  private async getDeviceInfo() {
    return {
      model: Platform.select({
        ios: 'iPhone',
        android: 'Android Device',
        default: 'Unknown',
      }),
      os: Platform.OS,
      osVersion: Platform.Version.toString(),
    };
  }

  private async getAppState() {
    return {
      version: Updates.manifest?.version,
      buildNumber: Updates.manifest?.ios?.buildNumber || Updates.manifest?.android?.versionCode,
      updateId: Updates.updateId,
      channel: Updates.channel,
    };
  }

  private async submitFeedbackToBackend(feedback: BetaFeedback): Promise<void> {
    // In production, submit to your feedback API
    console.log('Submitting feedback:', feedback);
  }

  private async loadPendingFeedback(): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem(BETA_FEEDBACK_KEY);
      if (pending) {
        this.pendingFeedback = JSON.parse(pending);
        
        // Try to submit pending feedback
        for (const feedback of this.pendingFeedback) {
          try {
            await this.submitFeedbackToBackend(feedback);
            // Remove from pending if successful
            this.pendingFeedback = this.pendingFeedback.filter(f => f.id !== feedback.id);
          } catch (error) {
            // Keep in pending if failed
          }
        }
        
        await this.savePendingFeedback();
      }
    } catch (error) {
      console.error('Failed to load pending feedback:', error);
    }
  }

  private async savePendingFeedback(): Promise<void> {
    try {
      await AsyncStorage.setItem(BETA_FEEDBACK_KEY, JSON.stringify(this.pendingFeedback));
    } catch (error) {
      console.error('Failed to save pending feedback:', error);
    }
  }

  private async getFeedbackCount(): Promise<number> {
    // In production, query from backend
    return this.betaInfo?.feedbackCount || 0;
  }

  private async getLastUpdateInfo(): Promise<string> {
    // In production, get from update history
    return new Date().toISOString();
  }

  private async getActiveTesterCount(): Promise<number> {
    // In production, query from backend
    return 150; // Mock value
  }
}

export const betaTesting = new BetaTestingService();