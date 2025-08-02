import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/data';
import { errorTracker } from './errorTracking';
import * as Sentry from '@sentry/react-native';

const FEEDBACK_STORAGE_KEY = '@voting_app_feedback';
const MAX_STORED_FEEDBACK = 50;

interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'general';
  message: string;
  email?: string;
  severity?: 'low' | 'medium' | 'high';
  tags?: string[];
  context?: {
    screen?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
  deviceInfo: {
    platform: string;
    version: string;
    appVersion: string;
  };
  timestamp: string;
  userId?: string;
  status: 'pending' | 'sent' | 'failed';
}

class FeedbackService {
  private client = generateClient();
  private userId?: string;

  /**
   * Set current user for feedback attribution
   */
  setUser(userId: string) {
    this.userId = userId;
  }

  /**
   * Clear user
   */
  clearUser() {
    this.userId = undefined;
  }

  /**
   * Submit feedback
   */
  async submitFeedback(feedback: Omit<FeedbackItem, 'id' | 'deviceInfo' | 'timestamp' | 'userId' | 'status'>) {
    const feedbackItem: FeedbackItem = {
      ...feedback,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      deviceInfo: await this.getDeviceInfo(),
      status: 'pending',
    };

    // Store locally first
    await this.storeFeedback(feedbackItem);

    try {
      // Send to backend
      await this.sendFeedbackToBackend(feedbackItem);
      
      // Mark as sent
      await this.updateFeedbackStatus(feedbackItem.id, 'sent');
      
      // Track in analytics
      this.trackFeedbackSubmission(feedbackItem);
      
      // If it's a bug report, also send to Sentry
      if (feedback.type === 'bug') {
        this.sendBugReportToSentry(feedbackItem);
      }
      
      return feedbackItem;
    } catch (error) {
      // Mark as failed but keep in storage for retry
      await this.updateFeedbackStatus(feedbackItem.id, 'failed');
      
      errorTracker.logError(error as Error, {
        action: 'submit_feedback',
        metadata: { feedbackId: feedbackItem.id },
      });
      
      throw error;
    }
  }

  /**
   * Store feedback locally
   */
  private async storeFeedback(feedback: FeedbackItem) {
    try {
      const existing = await this.getStoredFeedback();
      const updated = [feedback, ...existing].slice(0, MAX_STORED_FEEDBACK);
      await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to store feedback:', error);
    }
  }

  /**
   * Get stored feedback
   */
  async getStoredFeedback(): Promise<FeedbackItem[]> {
    try {
      const stored = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve feedback:', error);
      return [];
    }
  }

  /**
   * Update feedback status
   */
  private async updateFeedbackStatus(feedbackId: string, status: FeedbackItem['status']) {
    try {
      const feedback = await this.getStoredFeedback();
      const updated = feedback.map(item =>
        item.id === feedbackId ? { ...item, status } : item
      );
      await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update feedback status:', error);
    }
  }

  /**
   * Send feedback to backend
   */
  private async sendFeedbackToBackend(feedback: FeedbackItem) {
    // In a real app, this would send to your API
    // For now, we'll simulate with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Placeholder for actual API call
    console.log('Sending feedback to backend:', feedback);
  }

  /**
   * Send bug report to Sentry
   */
  private sendBugReportToSentry(feedback: FeedbackItem) {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setTag('feedback_type', 'bug');
      scope.setTag('severity', feedback.severity || 'medium');
      scope.setContext('feedback', {
        id: feedback.id,
        message: feedback.message,
        tags: feedback.tags,
        email: feedback.email,
      });
      
      if (feedback.context) {
        scope.setContext('feedback_context', feedback.context);
      }
      
      Sentry.captureMessage(`User Bug Report: ${feedback.message.substring(0, 100)}...`);
    });
  }

  /**
   * Track feedback submission
   */
  private trackFeedbackSubmission(feedback: FeedbackItem) {
    errorTracker.trackEvent('feedback_submitted', {
      type: feedback.type,
      severity: feedback.severity,
      hasTags: (feedback.tags?.length || 0) > 0,
      hasEmail: !!feedback.email,
      messageLength: feedback.message.length,
    });
  }

  /**
   * Get device info
   */
  private async getDeviceInfo() {
    const { Platform } = await import('react-native');
    const Constants = await import('expo-constants').then(m => m.default);
    
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      appVersion: Constants.expoConfig?.version || 'unknown',
    };
  }

  /**
   * Retry failed feedback
   */
  async retryFailedFeedback() {
    const feedback = await this.getStoredFeedback();
    const failed = feedback.filter(item => item.status === 'failed');
    
    for (const item of failed) {
      try {
        await this.sendFeedbackToBackend(item);
        await this.updateFeedbackStatus(item.id, 'sent');
      } catch (error) {
        console.error('Failed to retry feedback:', item.id, error);
      }
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats() {
    const feedback = await this.getStoredFeedback();
    
    const stats = {
      total: feedback.length,
      byType: {
        bug: 0,
        feature: 0,
        general: 0,
      },
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
      },
      byStatus: {
        pending: 0,
        sent: 0,
        failed: 0,
      },
    };
    
    feedback.forEach(item => {
      stats.byType[item.type]++;
      stats.byStatus[item.status]++;
      if (item.severity) {
        stats.bySeverity[item.severity]++;
      }
    });
    
    return stats;
  }

  /**
   * Clear all feedback
   */
  async clearFeedback() {
    try {
      await AsyncStorage.removeItem(FEEDBACK_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear feedback:', error);
    }
  }

  /**
   * Export feedback for analysis
   */
  async exportFeedback(type?: FeedbackItem['type']) {
    const feedback = await this.getStoredFeedback();
    const filtered = type ? feedback.filter(item => item.type === type) : feedback;
    
    return {
      exportDate: new Date().toISOString(),
      totalItems: filtered.length,
      feedback: filtered.map(item => ({
        ...item,
        // Anonymize email if present
        email: item.email ? `${item.email.charAt(0)}***@***` : undefined,
      })),
    };
  }
}

export const feedbackService = new FeedbackService();