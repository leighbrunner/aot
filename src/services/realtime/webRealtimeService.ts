// Web-specific realtime service that doesn't use Amplify
export interface VoteActivitySubscription {
  unsubscribe: () => void;
}

export interface StatsUpdateSubscription {
  unsubscribe: () => void;
}

class WebRealtimeService {
  /**
   * Mock subscribe to real-time vote activity for web
   */
  subscribeToVoteActivity(
    onNext: (activity: any) => void,
    onError?: (error: any) => void
  ): VoteActivitySubscription {
    console.log('Web realtime service: vote activity subscription (mock)');
    
    // For web, we'll use polling or server-sent events in the future
    return {
      unsubscribe: () => {
        console.log('Unsubscribed from vote activity');
      },
    };
  }

  /**
   * Mock subscribe to real-time stats updates for web
   */
  subscribeToStatsUpdates(
    onNext: (update: any) => void,
    onError?: (error: any) => void
  ): StatsUpdateSubscription {
    console.log('Web realtime service: stats update subscription (mock)');
    
    return {
      unsubscribe: () => {
        console.log('Unsubscribed from stats updates');
      },
    };
  }

  /**
   * Mock subscribe to specific vote activity by category
   */
  subscribeToCategoryActivity(
    category: string,
    onNext: (activity: any) => void,
    onError?: (error: any) => void
  ): VoteActivitySubscription {
    console.log(`Web realtime service: category ${category} subscription (mock)`);
    
    return {
      unsubscribe: () => {
        console.log(`Unsubscribed from category ${category} activity`);
      },
    };
  }

  /**
   * Get recent vote activity (mock)
   */
  async getRecentActivity(limit: number = 20) {
    console.log(`Getting recent activity (limit: ${limit}) - mock`);
    return [];
  }

  /**
   * Get latest stats updates (mock)
   */
  async getLatestStats() {
    console.log('Getting latest stats - mock');
    return [];
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    console.log('Cleaning up web realtime service');
  }
}

export const realtimeService = new WebRealtimeService();