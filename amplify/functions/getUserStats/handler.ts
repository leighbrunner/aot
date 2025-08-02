import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface UserStats {
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

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

interface RecentVote {
  voteId: string;
  winnerId: string;
  winnerName: string;
  winnerThumbnail: string;
  loserId: string;
  category: string;
  timestamp: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Get user ID from path or auth context
    const userId = event.pathParameters?.userId || 
                  event.requestContext.authorizer?.claims?.sub ||
                  event.headers['x-user-id'];
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'User ID required' }),
      };
    }
    
    // Fetch user profile
    const userResult = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { id: userId },
    }));
    
    if (!userResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    
    const user = userResult.Item;
    
    // Get recent votes
    const votesResult = await docClient.send(new QueryCommand({
      TableName: process.env.VOTES_TABLE_NAME,
      IndexName: 'userVotesIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Most recent first
      Limit: 50,
    }));
    
    const votes = votesResult.Items || [];
    
    // Calculate voting patterns
    const votingPatterns = calculateVotingPatterns(votes);
    
    // Calculate preference breakdown
    const categoryBreakdown = calculateCategoryBreakdown(votes);
    
    // Get achievements
    const achievements = calculateAchievements(user, votes);
    
    // Get recent activity with image details
    const recentVoteIds = votes.slice(0, 10);
    const imageIds = [...new Set(recentVoteIds.flatMap(v => [v.winnerId, v.loserId]))];
    
    let images = [];
    if (imageIds.length > 0) {
      const imagesResult = await docClient.send(new BatchGetCommand({
        RequestItems: {
          [process.env.IMAGES_TABLE_NAME!]: {
            Keys: imageIds.map(id => ({ id })),
          },
        },
      }));
      images = imagesResult.Responses?.[process.env.IMAGES_TABLE_NAME!] || [];
    }
    
    const recentActivity: RecentVote[] = recentVoteIds.map(vote => {
      const winner = images.find(img => img.id === vote.winnerId);
      return {
        voteId: vote.id,
        winnerId: vote.winnerId,
        winnerName: winner?.characterName || 'Unknown',
        winnerThumbnail: winner?.thumbnailUrl || winner?.url || '',
        loserId: vote.loserId,
        category: vote.category,
        timestamp: vote.createdAt,
      };
    });
    
    // Calculate comparative stats (simplified)
    const comparativeStats = {
      percentile: calculatePercentile(user.stats?.totalVotes || 0),
      rankAmongUsers: 0, // Would need to query all users
      avgVotesVsOthers: 1.0, // Would need aggregate data
    };
    
    const stats: UserStats = {
      userId,
      basicStats: {
        totalVotes: user.stats?.totalVotes || 0,
        currentStreak: user.stats?.currentStreak || 0,
        longestStreak: user.stats?.longestStreak || 0,
        lastVoteDate: user.stats?.lastVoteDate || null,
        memberSince: user.createdAt,
      },
      preferences: {
        primaryPreference: user.preferences?.primaryPreference,
        preferenceScore: user.preferences?.preferenceScore,
        categoryBreakdown,
      },
      votingPatterns,
      achievements,
      recentActivity,
      comparativeStats,
    };
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    
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

function calculateVotingPatterns(votes: any[]): UserStats['votingPatterns'] {
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<string, number> = {};
  const dateCounts: Record<string, number> = {};
  
  votes.forEach(vote => {
    const date = new Date(vote.createdAt);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateKey = date.toISOString().split('T')[0];
    
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
  });
  
  // Find most active hour
  const mostActiveHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 0;
  
  // Find most active day
  const mostActiveDay = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday';
  
  // Calculate average votes per day
  const uniqueDays = Object.keys(dateCounts).length;
  const averageVotesPerDay = uniqueDays > 0 ? votes.length / uniqueDays : 0;
  
  return {
    mostActiveHour: parseInt(mostActiveHour),
    mostActiveDay,
    averageVotesPerDay: Math.round(averageVotesPerDay * 10) / 10,
    votingHeatmap: dateCounts,
  };
}

function calculateCategoryBreakdown(votes: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  votes.forEach(vote => {
    breakdown[vote.category] = (breakdown[vote.category] || 0) + 1;
  });
  
  // Convert to percentages
  const total = votes.length;
  if (total > 0) {
    Object.keys(breakdown).forEach(category => {
      breakdown[category] = Math.round((breakdown[category] / total) * 100);
    });
  }
  
  return breakdown;
}

function calculateAchievements(user: any, votes: any[]): Achievement[] {
  const achievements: Achievement[] = [
    {
      id: 'first-vote',
      name: 'First Vote',
      description: 'Cast your first vote',
      unlockedAt: votes.length > 0 ? votes[votes.length - 1].createdAt : undefined,
    },
    {
      id: 'centurion',
      name: 'Centurion',
      description: 'Cast 100 votes',
      progress: Math.min(user.stats?.totalVotes || 0, 100),
      target: 100,
      unlockedAt: (user.stats?.totalVotes || 0) >= 100 ? new Date().toISOString() : undefined,
    },
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day voting streak',
      progress: Math.min(user.stats?.currentStreak || 0, 7),
      target: 7,
      unlockedAt: (user.stats?.currentStreak || 0) >= 7 ? new Date().toISOString() : undefined,
    },
    {
      id: 'preference-setter',
      name: 'Preference Setter',
      description: 'Develop a clear preference (70%+ in one category)',
      progress: Math.max(...Object.values(calculateCategoryBreakdown(votes))),
      target: 70,
      unlockedAt: Math.max(...Object.values(calculateCategoryBreakdown(votes))) >= 70 
        ? new Date().toISOString() 
        : undefined,
    },
  ];
  
  return achievements;
}

function calculatePercentile(totalVotes: number): number {
  // Simplified percentile calculation
  // In production, this would query aggregate user stats
  if (totalVotes >= 1000) return 95;
  if (totalVotes >= 500) return 85;
  if (totalVotes >= 100) return 70;
  if (totalVotes >= 50) return 50;
  if (totalVotes >= 10) return 30;
  return 10;
}