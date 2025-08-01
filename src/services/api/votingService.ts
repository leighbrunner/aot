import { generateClient } from 'aws-amplify/data';
import { Schema } from '@/amplify/data/resource';
import { authService } from '@/services/auth/authService';
import { offlineManager } from '@/services/offline/offlineManager';

const client = generateClient<Schema>();

export interface ImagePair {
  sessionId: string;
  images: Array<{
    imageId: string;
    url: string;
    thumbnailUrl: string;
    characterName: string;
    categories: string[];
  }>;
}

export interface VoteSubmission {
  winnerId: string;
  loserId: string;
  category: string;
  sessionId: string;
}

export interface VoteResult {
  success: boolean;
  voteId: string;
  message: string;
}

class VotingService {
  private preloadedPairs: ImagePair[] = [];
  private votedPairs: Set<string> = new Set();
  private currentSessionId: string | null = null;

  async getImagePair(category?: string): Promise<ImagePair> {
    try {
      // Check preloaded pairs first
      if (this.preloadedPairs.length > 0) {
        const pair = this.preloadedPairs.shift()!;
        // Preload another pair in background
        this.preloadNextPair(category);
        return pair;
      }

      // Fetch new pair
      const response = await fetch(`${process.env.API_ENDPOINT}/images/pair${category ? `?category=${category}` : ''}`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No more images available in this category');
        }
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error(`Failed to fetch image pair: ${response.status}`);
      }

      const pair = await response.json();
      this.currentSessionId = pair.sessionId;

      // Cache images for offline use
      offlineManager.cacheImages(pair.images);

      // Preload next pair
      this.preloadNextPair(category);

      return pair;
    } catch (error) {
      console.error('Error getting image pair:', error);
      throw error;
    }
  }

  private async preloadNextPair(category?: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.API_ENDPOINT}/images/pair${category ? `?category=${category}` : ''}`, {
        headers: await this.getAuthHeaders(),
      });

      if (response.ok) {
        const pair = await response.json();
        this.preloadedPairs.push(pair);
      }
    } catch (error) {
      console.error('Error preloading image pair:', error);
    }
  }

  async submitVote(vote: VoteSubmission): Promise<VoteResult> {
    try {
      // Mark pair as voted
      const pairKey = [vote.winnerId, vote.loserId].sort().join('-');
      this.votedPairs.add(pairKey);

      // Check if online
      if (!offlineManager.getOnlineStatus()) {
        // Save vote offline
        await offlineManager.saveVoteOffline(vote);
        return {
          success: true,
          voteId: `offline_${Date.now()}`,
          message: 'Vote saved offline. Will sync when online.',
        };
      }

      const response = await fetch(`${process.env.API_ENDPOINT}/vote`, {
        method: 'POST',
        headers: {
          ...await this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vote),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('You have already voted on this pair');
        }
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 429) {
          throw new Error('Too many votes. Please slow down');
        }
        throw new Error(`Failed to submit vote: ${response.status}`);
      }

      const result = await response.json();

      // Update user stats in store
      await this.updateUserStats();

      return result;
    } catch (error: any) {
      // If network error, save offline
      if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        await offlineManager.saveVoteOffline(vote);
        return {
          success: true,
          voteId: `offline_${Date.now()}`,
          message: 'Vote saved offline. Will sync when online.',
        };
      }
      
      console.error('Error submitting vote:', error);
      throw error;
    }
  }

  async getUserStats() {
    try {
      const response = await fetch(`${process.env.API_ENDPOINT}/user/stats`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getVotingHistory(limit = 50) {
    try {
      const response = await fetch(`${process.env.API_ENDPOINT}/user/history?limit=${limit}`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voting history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting voting history:', error);
      throw error;
    }
  }

  hasVotedOnPair(imageId1: string, imageId2: string): boolean {
    const pairKey = [imageId1, imageId2].sort().join('-');
    return this.votedPairs.has(pairKey);
  }

  private async updateUserStats(): Promise<void> {
    try {
      const stats = await this.getUserStats();
      // Update store with new stats
      const { useVotingStore } = await import('@/store/voting.store');
      const store = useVotingStore.getState();
      
      store.setPreferences(stats.preferences || {});
      store.incrementTotalVotes();
      
      // Check and update streak
      const lastVoteDate = stats.stats?.lastVoteDate;
      if (lastVoteDate) {
        const lastVote = new Date(lastVoteDate);
        const now = new Date();
        const hoursSinceLastVote = (now.getTime() - lastVote.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastVote < 24) {
          store.incrementStreak();
        } else {
          store.resetStreak();
        }
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  private async getAuthHeaders() {
    const token = await authService.getAuthToken();
    const authState = authService.getCurrentAuthState();
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-User-Id': authState.userId || 'anonymous',
      'X-Is-Anonymous': authState.isAnonymous ? 'true' : 'false',
    };
  }

  clearCache() {
    this.preloadedPairs = [];
    this.votedPairs.clear();
    this.currentSessionId = null;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

export const votingService = new VotingService();