import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

interface LeaderboardQuery {
  period: Period;
  category?: string;
  limit?: number;
  lastEvaluatedKey?: any;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse query parameters
    const query: LeaderboardQuery = {
      period: (event.queryStringParameters?.period as Period) || 'all',
      category: event.queryStringParameters?.category,
      limit: parseInt(event.queryStringParameters?.limit || '20'),
      lastEvaluatedKey: event.queryStringParameters?.nextToken 
        ? JSON.parse(Buffer.from(event.queryStringParameters.nextToken, 'base64').toString())
        : undefined,
    };
    
    // Validate parameters
    if (!['day', 'week', 'month', 'year', 'all'].includes(query.period)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid period parameter' }),
      };
    }
    
    if (query.limit < 1 || query.limit > 100) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Limit must be between 1 and 100' }),
      };
    }
    
    // Get date range for period
    const dateKey = getDateKeyForPeriod(query.period);
    
    // For real-time leaderboard, query images directly and sort by rating
    // In production, this would use the analytics table for aggregated data
    let leaderboardItems: any[] = [];
    let nextToken: string | null = null;
    
    if (query.period === 'all') {
      // Query images table directly for all-time leaderboard
      const scanResult = await docClient.send(new QueryCommand({
        TableName: process.env.IMAGES_TABLE_NAME,
        IndexName: 'imagesByRating', // GSI that sorts by rating
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'approved',
          ...(query.category && { ':category': query.category }),
        },
        FilterExpression: query.category ? 'contains(categories, :category)' : undefined,
        ScanIndexForward: false, // Sort by rating descending
        Limit: query.limit,
        ExclusiveStartKey: query.lastEvaluatedKey,
      }));
      
      leaderboardItems = scanResult.Items?.map((item, index) => ({
        rank: (query.lastEvaluatedKey ? 0 : 0) + index + 1,
        imageId: item.id,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        characterName: item.characterName,
        categories: item.categories || [],
        voteCount: item.voteCount || 0,
        winCount: item.winCount || 0,
        winRate: item.rating || 0,
        metadata: item.metadata,
      })) || [];
      
      nextToken = scanResult.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(scanResult.LastEvaluatedKey)).toString('base64')
        : null;
    } else {
      // For time-based leaderboards, query analytics table
      const analyticsResult = await docClient.send(new QueryCommand({
        TableName: process.env.ANALYTICS_TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `ANALYTICS#image#${query.period}`,
          ':skPrefix': `ITEM#${dateKey}`,
          ...(query.category && { ':category': query.category }),
        },
        FilterExpression: query.category ? 'contains(categories, :category)' : undefined,
        ScanIndexForward: false, // Sort by SK (which includes win rate) descending
        Limit: query.limit,
        ExclusiveStartKey: query.lastEvaluatedKey,
      }));
      
      // Get image IDs from analytics results
      const imageIds = analyticsResult.Items?.map(item => item.itemId) || [];
      
      if (imageIds.length > 0) {
        // Batch get image details
        const imagesResult = await docClient.send(new BatchGetCommand({
          RequestItems: {
            [process.env.IMAGES_TABLE_NAME!]: {
              Keys: imageIds.map(id => ({ id })),
            },
          },
        }));
        
        const images = imagesResult.Responses?.[process.env.IMAGES_TABLE_NAME!] || [];
        
        // Combine analytics data with image data
        leaderboardItems = analyticsResult.Items?.map((analyticsItem, index) => {
          const image = images.find(img => img.id === analyticsItem.itemId);
          return {
            rank: (query.lastEvaluatedKey ? 0 : 0) + index + 1,
            imageId: analyticsItem.itemId,
            url: image?.url,
            thumbnailUrl: image?.thumbnailUrl,
            characterName: image?.characterName,
            categories: image?.categories || [],
            voteCount: analyticsItem.voteCount || 0,
            winCount: analyticsItem.winCount || 0,
            winRate: analyticsItem.winRate || 0,
            metadata: image?.metadata,
          };
        }).filter(item => item.url) || [];
      }
      
      nextToken = analyticsResult.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(analyticsResult.LastEvaluatedKey)).toString('base64')
        : null;
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': getCacheControlForPeriod(query.period),
      },
      body: JSON.stringify({
        items: leaderboardItems,
        nextToken,
        period: query.period,
        category: query.category,
      }),
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    
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

function getDateKeyForPeriod(period: Period): string {
  const now = new Date();
  
  switch (period) {
    case 'day':
      return now.toISOString().split('T')[0];
    
    case 'week':
      // Get Monday of current week
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return monday.toISOString().split('T')[0];
    
    case 'month':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    case 'year':
      return String(now.getFullYear());
    
    case 'all':
      return 'all-time';
    
    default:
      return 'all-time';
  }
}

function getCacheControlForPeriod(period: Period): string {
  switch (period) {
    case 'day':
      return 'public, max-age=300'; // 5 minutes
    case 'week':
      return 'public, max-age=900'; // 15 minutes
    case 'month':
      return 'public, max-age=1800'; // 30 minutes
    case 'year':
      return 'public, max-age=3600'; // 1 hour
    case 'all':
      return 'public, max-age=3600'; // 1 hour
    default:
      return 'public, max-age=300';
  }
}