import { generateClient } from 'aws-amplify/api';
import { get, post } from 'aws-amplify/api';
import type { Schema } from '../../../amplify/data/resource';
import { voteQueue } from '../voting/voteQueue';
import NetInfo from '@react-native-community/netinfo';

// Lazy initialize the client to ensure Amplify is configured first
let client: ReturnType<typeof generateClient<Schema>> | null = null;

const getClient = () => {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
};

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
      const queryParams = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await get({
        apiName: 'votingAPI',
        path: `/images/pair${queryParams}`,
      }).response;
      
      const data = await response.body.json();
      return data as ImagePairResponse;
    } catch (error) {
      console.error('Error fetching image pair:', error);
      throw error;
    }
  },

  // Submit a vote with offline support
  async submitVote(
    winnerId: string,
    loserId: string,
    category: string,
    sessionId: string
  ): Promise<VoteResult> {
    try {
      // Check network status
      const netState = await NetInfo.fetch();
      
      if (!netState.isConnected) {
        // Queue vote for later
        const queueId = await voteQueue.addVote({
          winnerId,
          loserId,
          category,
          sessionId,
        });
        
        return {
          success: true,
          queued: true,
          message: 'Vote queued for submission when online',
          voteId: queueId,
        };
      }
      
      // Try to submit vote
      const response = await post({
        apiName: 'votingAPI',
        path: '/vote',
        options: {
          body: {
            winnerId,
            loserId,
            category,
            sessionId,
          },
        },
      }).response;
      
      if (response.statusCode === 409) {
        // Duplicate vote
        const data = await response.body.json();
        return {
          success: false,
          error: 'Duplicate vote detected',
          message: data.message,
        };
      }
      
      const data = await response.body.json();
      return data as VoteResult;
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      
      // Queue vote on network error
      if (error.name === 'NetworkError' || !navigator.onLine) {
        const queueId = await voteQueue.addVote({
          winnerId,
          loserId,
          category,
          sessionId,
        });
        
        return {
          success: true,
          queued: true,
          message: 'Vote queued for submission when online',
          voteId: queueId,
        };
      }
      
      throw error;
    }
  },

  // Get user voting statistics
  async getUserStats(userId: string) {
    try {
      const user = await getClient().graphql({
        query: `
          query GetUser($id: ID!) {
            getUser(id: $id) {
              id
              stats
              preferences
            }
          }
        `,
        variables: { id: userId },
      });
      
      return user.data.getUser;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  // Get voting history
  async getVotingHistory(userId: string, limit = 20) {
    try {
      const response = await getClient().graphql({
        query: `
          query ListVotesByUser($userId: String!, $limit: Int) {
            votesByUserId(userId: $userId, limit: $limit) {
              items {
                id
                winnerId
                loserId
                category
                createdAt
              }
            }
          }
        `,
        variables: { userId, limit },
      });
      
      return response.data.votesByUserId.items;
    } catch (error) {
      console.error('Error fetching voting history:', error);
      throw error;
    }
  },
};