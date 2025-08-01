import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const period = event.pathParameters?.period || 'day';
    const category = event.queryStringParameters?.category;
    const limit = parseInt(event.queryStringParameters?.limit || '20');
    
    // Validate period
    const validPeriods = ['day', 'week', 'month', 'year', 'all'];
    if (!validPeriods.includes(period)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid period' }),
      };
    }
    
    // Calculate date for period
    const now = new Date();
    let dateStr;
    
    switch (period) {
      case 'day':
        dateStr = now.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        dateStr = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        dateStr = now.toISOString().substring(0, 7);
        break;
      case 'year':
        dateStr = now.getFullYear().toString();
        break;
      case 'all':
        dateStr = 'all-time';
        break;
    }
    
    // Query analytics table
    const queryParams = {
      TableName: process.env.ANALYTICS_TABLE_NAME,
      KeyConditionExpression: '#type = :type AND #period = :period',
      ExpressionAttributeNames: {
        '#type': 'type',
        '#period': 'period',
      },
      ExpressionAttributeValues: {
        ':type': 'image',
        ':period': `${period}#${dateStr}`,
      },
      Limit: limit,
      ScanIndexForward: false, // Sort by highest win rate
    };
    
    if (category) {
      queryParams.FilterExpression = 'contains(categories, :category)';
      queryParams.ExpressionAttributeValues[':category'] = category;
    }
    
    const result = await docClient.send(new QueryCommand(queryParams));
    const items = result.Items || [];
    
    // Get image details
    const imageIds = items.map(item => item.itemId);
    const images = await Promise.all(
      imageIds.map(async (imageId) => {
        const imageResult = await docClient.send(new GetCommand({
          TableName: process.env.IMAGES_TABLE_NAME,
          Key: { imageId },
        }));
        return imageResult.Item;
      })
    );
    
    const leaderboard = items.map((item, index) => ({
      rank: index + 1,
      imageId: item.itemId,
      image: images[index],
      stats: {
        voteCount: item.voteCount,
        winCount: item.winCount,
        winRate: item.winRate,
      },
      period,
      date: dateStr,
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period,
        date: dateStr,
        category,
        items: leaderboard,
        hasMore: result.LastEvaluatedKey ? true : false,
      }),
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
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