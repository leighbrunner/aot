// Web-specific voting API that doesn't use Amplify
import { authService } from '../auth/webAuthService';

export interface ImagePair {
  id: string;
  url: string;
  thumbnailUrl: string;
  characterId: string;
  characterName: string;
  categories: string[];
  metadata?: any;
  voteCount: number;
  winCount: number;
  rating: number;
}

export interface VoteResult {
  success: boolean;
  voteId?: string;
  message?: string;
  error?: string;
  queued?: boolean;
  currentStreak?: number;
  longestStreak?: number;
}

export interface ImagePairResponse {
  images: ImagePair[];
  sessionId: string;
}

export const votingAPI = {
  // Get a random pair of images to vote on
  async getImagePair(category?: string): Promise<ImagePairResponse> {
    try {
      // For now, return mock data for web
      const mockImages: ImagePair[] = [
        {
          id: '1',
          url: 'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Image+1',
          thumbnailUrl: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=1',
          characterId: 'char1',
          characterName: 'Character 1',
          categories: ['category1'],
          voteCount: 100,
          winCount: 60,
          rating: 1200,
        },
        {
          id: '2',
          url: 'https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Image+2',
          thumbnailUrl: 'https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=2',
          characterId: 'char2',
          characterName: 'Character 2',
          categories: ['category1'],
          voteCount: 90,
          winCount: 45,
          rating: 1100,
        },
      ];

      return {
        images: mockImages,
        sessionId: `session_${Date.now()}`,
      };
    } catch (error) {
      console.error('Error getting image pair:', error);
      throw error;
    }
  },

  // Submit a vote
  async submitVote(
    winnerId: string,
    loserId: string,
    category: string,
    sessionId: string
  ): Promise<VoteResult> {
    try {
      const token = await authService.getAuthToken();
      
      console.log('Submitting vote:', { winnerId, loserId, category, sessionId });
      
      // Mock successful vote
      return {
        success: true,
        voteId: `vote_${Date.now()}`,
        message: 'Vote submitted successfully',
        currentStreak: 1,
        longestStreak: 1,
      };
    } catch (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit vote',
      };
    }
  },

  // Get user voting statistics
  async getUserStats(): Promise<any> {
    try {
      return {
        totalVotes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastVoteDate: null,
        preferenceScore: 0.5,
        votesByCategory: {},
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },

  // Get voting history
  async getVotingHistory(limit: number = 20): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.error('Error getting voting history:', error);
      throw error;
    }
  },
};