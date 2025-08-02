import * as Sentry from '@sentry/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorTracker } from './errorTracking';

const CRASH_REPORT_KEY = '@voting_app_crash_reports';
const MAX_STORED_CRASHES = 10;

interface CrashReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    type?: string;
  };
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
  };
  appState: {
    screen?: string;
    userId?: string;
    sessionId?: string;
  };
}

class CrashReportingService {
  private lastCrashId?: string;
  private crashHandlersRegistered = false;

  /**
   * Initialize crash reporting
   */
  async initialize() {
    if (this.crashHandlersRegistered) return;

    // Register global error handlers
    this.registerErrorHandlers();
    
    // Check for previous crashes
    await this.checkForPreviousCrashes();
    
    // Set up native crash handlers
    this.setupNativeCrashHandlers();
    
    this.crashHandlersRegistered = true;
  }

  /**
   * Register JavaScript error handlers
   */
  private registerErrorHandlers() {
    // Handle unhandled promise rejections
    const originalHandler = global.onunhandledrejection;
    global.onunhandledrejection = (event: any) => {
      const error = event.reason || new Error('Unhandled Promise Rejection');
      this.handleCrash(error, 'unhandledRejection');
      
      if (originalHandler) {
        originalHandler(event);
      }
    };

    // Handle global errors
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      if (isFatal) {
        this.handleCrash(error, 'fatalError');
      } else {
        errorTracker.logError(error, {
          metadata: { isFatal: false },
        });
      }

      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }

  /**
   * Set up native crash handlers
   */
  private setupNativeCrashHandlers() {
    // Sentry handles native crashes automatically
    // Add any additional native crash handling here
  }

  /**
   * Handle a crash
   */
  private async handleCrash(error: Error, type: string) {
    const crashReport: CrashReport = {
      id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        type: error.name || type,
      },
      deviceInfo: {
        platform: Sentry.ReactNative.Platform.OS,
        version: Sentry.ReactNative.Platform.Version.toString(),
        model: await this.getDeviceModel(),
      },
      appState: await this.captureAppState(),
    };

    // Store crash locally
    await this.storeCrashReport(crashReport);
    
    // Send to Sentry
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        crash_type: type,
        crash_id: crashReport.id,
      },
      contexts: {
        crash_report: crashReport,
      },
    });

    this.lastCrashId = crashReport.id;
  }

  /**
   * Store crash report locally
   */
  private async storeCrashReport(report: CrashReport) {
    try {
      const existingReports = await this.getStoredCrashReports();
      const updatedReports = [report, ...existingReports].slice(0, MAX_STORED_CRASHES);
      
      await AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Failed to store crash report:', error);
    }
  }

  /**
   * Get stored crash reports
   */
  private async getStoredCrashReports(): Promise<CrashReport[]> {
    try {
      const stored = await AsyncStorage.getItem(CRASH_REPORT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve crash reports:', error);
      return [];
    }
  }

  /**
   * Check for previous crashes on app start
   */
  private async checkForPreviousCrashes() {
    const reports = await this.getStoredCrashReports();
    
    if (reports.length > 0) {
      const lastCrash = reports[0];
      const timeSinceCrash = Date.now() - new Date(lastCrash.timestamp).getTime();
      
      // If crashed within last 5 minutes, show recovery dialog
      if (timeSinceCrash < 5 * 60 * 1000) {
        this.showCrashRecoveryDialog(lastCrash);
      }
      
      // Send any unsent crash reports
      await this.sendPendingCrashReports(reports);
    }
  }

  /**
   * Show crash recovery dialog
   */
  private showCrashRecoveryDialog(crash: CrashReport) {
    Alert.alert(
      'App Recovered from Crash',
      'The app crashed unexpectedly. Would you like to send a crash report to help us fix the issue?',
      [
        {
          text: 'Send Report',
          onPress: () => this.sendCrashReport(crash),
        },
        {
          text: 'Don\'t Send',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Send crash report with user feedback
   */
  async sendCrashReport(crash: CrashReport, userFeedback?: string) {
    const sentryEventId = Sentry.captureMessage(`Crash Report: ${crash.id}`, 'error');
    
    if (userFeedback) {
      await errorTracker.captureUserFeedback({
        message: `Crash feedback: ${userFeedback}`,
      });
    }

    // Mark as sent
    await this.markCrashReportAsSent(crash.id);
    
    return sentryEventId;
  }

  /**
   * Send all pending crash reports
   */
  private async sendPendingCrashReports(reports: CrashReport[]) {
    for (const report of reports) {
      // Check if already sent (you'd implement this check)
      const isSent = false;
      
      if (!isSent) {
        await this.sendCrashReport(report);
      }
    }
  }

  /**
   * Mark crash report as sent
   */
  private async markCrashReportAsSent(crashId: string) {
    try {
      const reports = await this.getStoredCrashReports();
      const updatedReports = reports.filter(r => r.id !== crashId);
      await AsyncStorage.setItem(CRASH_REPORT_KEY, JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Failed to mark crash report as sent:', error);
    }
  }

  /**
   * Get device model
   */
  private async getDeviceModel(): Promise<string | undefined> {
    try {
      const { Device } = await import('expo-device');
      return Device.modelName || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Capture current app state
   */
  private async captureAppState() {
    // This would capture current screen, user session, etc.
    return {
      screen: 'Unknown', // Would get from navigation
      userId: undefined, // Would get from auth
      sessionId: `session_${Date.now()}`,
    };
  }

  /**
   * Clear crash reports
   */
  async clearCrashReports() {
    try {
      await AsyncStorage.removeItem(CRASH_REPORT_KEY);
    } catch (error) {
      console.error('Failed to clear crash reports:', error);
    }
  }

  /**
   * Get crash statistics
   */
  async getCrashStatistics() {
    const reports = await this.getStoredCrashReports();
    
    const stats = {
      totalCrashes: reports.length,
      crashesByType: {} as Record<string, number>,
      crashesByScreen: {} as Record<string, number>,
      recentCrashes: reports.slice(0, 5),
    };

    reports.forEach(report => {
      // Count by type
      const type = report.error.type || 'Unknown';
      stats.crashesByType[type] = (stats.crashesByType[type] || 0) + 1;
      
      // Count by screen
      const screen = report.appState.screen || 'Unknown';
      stats.crashesByScreen[screen] = (stats.crashesByScreen[screen] || 0) + 1;
    });

    return stats;
  }

  /**
   * Test crash (development only)
   */
  testCrash() {
    if (!__DEV__) return;
    
    throw new Error('Test crash from crash reporting service');
  }
}

export const crashReporter = new CrashReportingService();