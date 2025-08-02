import { get } from 'aws-amplify/api';

export interface UserStats {
  userId: string;
  basicStats: {
    totalVotes: number;
    currentStreak: number;
    longestStreak: number;
    lastVoteDate: string | null;
    memberSince: string;
  };
  preferences: {
    primaryPreference?: 'ass' | 'tits';
    preferenceScore?: number;
    categoryBreakdown: Record<string, number>;
  };
  votingPatterns: {
    mostActiveHour: number;
    mostActiveDay: string;
    averageVotesPerDay: number;
    votingHeatmap: Record<string, number>;
  };
  achievements: Achievement[];
  recentActivity: RecentVote[];
  comparativeStats: {
    percentile: number;
    rankAmongUsers: number;
    avgVotesVsOthers: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface RecentVote {
  voteId: string;
  winnerId: string;
  winnerName: string;
  winnerThumbnail: string;
  loserId: string;
  category: string;
  timestamp: string;
}

export const userStatsAPI = {
  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const response = await get({
        apiName: 'votingAPI',
        path: `/users/${userId}/stats`,
      }).response;
      
      const data = await response.body.json();
      return data as UserStats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  // Export user data
  async exportUserData(userId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const response = await get({
        apiName: 'votingAPI',
        path: `/users/${userId}/export?format=${format}`,
      }).response;
      
      return await response.body.blob();
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },
};