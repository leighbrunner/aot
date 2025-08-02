import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';
import type { Subscription } from 'rxjs';

const client = generateClient<Schema>();

export interface VoteActivitySubscription {
  unsubscribe: () => void;
}

export interface StatsUpdateSubscription {
  unsubscribe: () => void;
}

class RealtimeService {
  private voteActivitySubscription: Subscription | null = null;
  private statsUpdateSubscription: Subscription | null = null;

  /**
   * Subscribe to real-time vote activity
   */
  subscribeToVoteActivity(
    onNext: (activity: Schema['VoteActivity']['type']) => void,
    onError?: (error: any) => void
  ): VoteActivitySubscription {
    try {
      const subscription = client.models.VoteActivity.observeQuery({
        limit: 50,
        sortDirection: 'DESC',
      }).subscribe({
        next: ({ items }) => {
          // Get the latest activity
          if (items.length > 0) {
            onNext(items[0]);
          }
        },
        error: (error) => {
          console.error('Vote activity subscription error:', error);
          onError?.(error);
        },
      });

      this.voteActivitySubscription = subscription;

      return {
        unsubscribe: () => {
          subscription.unsubscribe();
          this.voteActivitySubscription = null;
        },
      };
    } catch (error) {
      console.error('Failed to subscribe to vote activity:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time stats updates
   */
  subscribeToStatsUpdates(
    onNext: (update: Schema['StatsUpdate']['type']) => void,
    onError?: (error: any) => void
  ): StatsUpdateSubscription {
    try {
      const subscription = client.models.StatsUpdate.observeQuery({
        limit: 10,
        sortDirection: 'DESC',
      }).subscribe({
        next: ({ items }) => {
          // Get the latest update
          if (items.length > 0) {
            onNext(items[0]);
          }
        },
        error: (error) => {
          console.error('Stats update subscription error:', error);
          onError?.(error);
        },
      });

      this.statsUpdateSubscription = subscription;

      return {
        unsubscribe: () => {
          subscription.unsubscribe();
          this.statsUpdateSubscription = null;
        },
      };
    } catch (error) {
      console.error('Failed to subscribe to stats updates:', error);
      throw error;
    }
  }

  /**
   * Subscribe to specific vote activity by category
   */
  subscribeToCategoryActivity(
    category: string,
    onNext: (activity: Schema['VoteActivity']['type']) => void,
    onError?: (error: any) => void
  ): VoteActivitySubscription {
    try {
      const subscription = client.models.VoteActivity.observeQuery({
        filter: { category: { eq: category } },
        limit: 20,
        sortDirection: 'DESC',
      }).subscribe({
        next: ({ items }) => {
          if (items.length > 0) {
            onNext(items[0]);
          }
        },
        error: (error) => {
          console.error('Category activity subscription error:', error);
          onError?.(error);
        },
      });

      return {
        unsubscribe: () => {
          subscription.unsubscribe();
        },
      };
    } catch (error) {
      console.error('Failed to subscribe to category activity:', error);
      throw error;
    }
  }

  /**
   * Get recent vote activity
   */
  async getRecentActivity(limit: number = 20) {
    try {
      const response = await client.models.VoteActivity.list({
        limit,
        sortDirection: 'DESC',
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      throw error;
    }
  }

  /**
   * Get latest stats updates
   */
  async getLatestStats() {
    try {
      const response = await client.models.StatsUpdate.list({
        limit: 10,
        sortDirection: 'DESC',
      });

      // Group by type and get the latest of each
      const latestByType = new Map<string, Schema['StatsUpdate']['type']>();
      
      response.data.forEach(update => {
        if (!latestByType.has(update.type)) {
          latestByType.set(update.type, update);
        }
      });

      return Array.from(latestByType.values());
    } catch (error) {
      console.error('Failed to get latest stats:', error);
      throw error;
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    if (this.voteActivitySubscription) {
      this.voteActivitySubscription.unsubscribe();
      this.voteActivitySubscription = null;
    }

    if (this.statsUpdateSubscription) {
      this.statsUpdateSubscription.unsubscribe();
      this.statsUpdateSubscription = null;
    }
  }
}

export const realtimeService = new RealtimeService();