import { generateClient } from 'aws-amplify/api';
import { get, post } from 'aws-amplify/api';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

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
  voteId: string;
  message: string;
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

  // Submit a vote
  async submitVote(
    winnerId: string,
    loserId: string,
    category: string,
    sessionId: string
  ): Promise<VoteResult> {
    try {
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
      
      const data = await response.body.json();
      return data as VoteResult;
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  },

  // Get user voting statistics
  async getUserStats(userId: string) {
    try {
      const user = await client.graphql({
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
      const response = await client.graphql({
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