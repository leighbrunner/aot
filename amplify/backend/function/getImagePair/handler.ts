import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const category = event.queryStringParameters?.category;
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';
    
    // Get approved images
    const scanParams = {
      TableName: process.env.IMAGES_TABLE_NAME,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'approved',
      },
    };
    
    if (category) {
      scanParams.FilterExpression += ' AND contains(categories, :category)';
      scanParams.ExpressionAttributeValues[':category'] = category;
    }
    
    const result = await docClient.send(new ScanCommand(scanParams));
    const images = result.Items || [];
    
    if (images.length < 2) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Not enough images available' }),
      };
    }
    
    // Get user's voting history to avoid duplicates
    const votesResult = await docClient.send(new QueryCommand({
      TableName: process.env.VOTES_TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: 100,
      ScanIndexForward: false,
    }));
    
    const recentVotes = votesResult.Items || [];
    const votedPairs = new Set(
      recentVotes.map(vote => 
        [vote.winnerId, vote.loserId].sort().join('-')
      )
    );
    
    // Create weighted array based on promotion weights
    const weightedImages: any[] = [];
    images.forEach(image => {
      const weight = image.promotionWeight || 1;
      for (let i = 0; i < weight; i++) {
        weightedImages.push(image);
      }
    });
    
    // Find a pair the user hasn't voted on
    let image1, image2;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      const idx1 = Math.floor(Math.random() * weightedImages.length);
      let idx2 = Math.floor(Math.random() * weightedImages.length);
      
      // Ensure we get different images (not just different indices)
      while (weightedImages[idx2].imageId === weightedImages[idx1].imageId) {
        idx2 = Math.floor(Math.random() * weightedImages.length);
      }
      
      image1 = weightedImages[idx1];
      image2 = weightedImages[idx2];
      
      const pairKey = [image1.imageId, image2.imageId].sort().join('-');
      
      if (!votedPairs.has(pairKey)) {
        break;
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [image1, image2],
        sessionId: `session-${Date.now()}`,
      }),
    };
  } catch (error) {
    console.error('Error getting image pair:', error);
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