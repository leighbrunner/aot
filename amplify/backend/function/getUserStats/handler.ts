import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';
    
    // Get user profile
    const userResult = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { userId },
    }));
    
    const user = userResult.Item || {
      userId,
      stats: {
        totalVotes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastVoteDate: null,
      },
      preferences: {},
    };
    
    // Calculate preference based on recent votes
    const votesResult = await docClient.send(new QueryCommand({
      TableName: process.env.VOTES_TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: 50,
      ScanIndexForward: false,
    }));
    
    const recentVotes = votesResult.Items || [];
    const categoryVotes = {};
    
    recentVotes.forEach(vote => {
      categoryVotes[vote.category] = (categoryVotes[vote.category] || 0) + 1;
    });
    
    // Determine primary preference
    const preferences = Object.entries(categoryVotes)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category,
        percentage: (count / recentVotes.length) * 100,
      }));
    
    if (preferences.length > 0) {
      user.preferences.primaryPreference = preferences[0].category;
      user.preferences.preferenceScore = preferences[0].percentage;
    }
    
    // Calculate streak
    if (user.stats.lastVoteDate) {
      const lastVote = new Date(user.stats.lastVoteDate);
      const now = new Date();
      const hoursSinceLastVote = (now - lastVote) / (1000 * 60 * 60);
      
      if (hoursSinceLastVote > 24) {
        user.stats.currentStreak = 0;
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.userId,
        stats: user.stats,
        preferences: user.preferences,
        recentActivity: {
          votesLast24h: recentVotes.filter(v => {
            const voteTime = new Date(v.timestamp);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return voteTime > dayAgo;
          }).length,
          categoryBreakdown: preferences,
        },
      }),
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};