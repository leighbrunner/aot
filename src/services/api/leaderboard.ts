import { get } from 'aws-amplify/api';

export type Period = 'day' | 'week' | 'month' | 'year' | 'all';

export interface LeaderboardItem {
  rank: number;
  imageId: string;
  url: string;
  thumbnailUrl?: string;
  characterName: string;
  categories: string[];
  voteCount: number;
  winCount: number;
  winRate: number;
  metadata?: any;
}

export interface LeaderboardQuery {
  period: Period;
  category?: string;
  limit?: number;
  nextToken?: string;
}

export interface LeaderboardResponse {
  items: LeaderboardItem[];
  nextToken: string | null;
  period: Period;
  category?: string;
}

export const leaderboardAPI = {
  // Get leaderboard data
  async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        period: query.period,
        ...(query.category && { category: query.category }),
        ...(query.limit && { limit: query.limit.toString() }),
        ...(query.nextToken && { nextToken: query.nextToken }),
      });
      
      const response = await get({
        apiName: 'votingAPI',
        path: `/leaderboard?${params.toString()}`,
      }).response;
      
      const data = await response.body.json();
      return data as LeaderboardResponse;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },
  
  // Get leaderboard for specific character
  async getCharacterLeaderboard(
    characterId: string,
    period: Period = 'all'
  ): Promise<LeaderboardResponse> {
    try {
      const response = await get({
        apiName: 'votingAPI',
        path: `/leaderboard/character/${characterId}?period=${period}`,
      }).response;
      
      const data = await response.body.json();
      return data as LeaderboardResponse;
    } catch (error) {
      console.error('Error fetching character leaderboard:', error);
      throw error;
    }
  },
  
  // Get country-based leaderboard
  async getCountryLeaderboard(
    period: Period = 'all'
  ): Promise<any> {
    try {
      const response = await get({
        apiName: 'votingAPI',
        path: `/leaderboard/countries?period=${period}`,
      }).response;
      
      const data = await response.body.json();
      return data;
    } catch (error) {
      console.error('Error fetching country leaderboard:', error);
      throw error;
    }
  },
};