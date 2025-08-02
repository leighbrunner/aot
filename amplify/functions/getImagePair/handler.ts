import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const category = event.queryStringParameters?.category;
    const userId = event.requestContext.authorizer?.claims?.sub || 
                  event.headers?.['x-anonymous-id'] || 
                  'anonymous';
    const cloudfrontUrl = process.env.CLOUDFRONT_URL;
    
    // Get approved images using secondary index
    const queryParams: any = {
      TableName: process.env.IMAGES_TABLE_NAME,
      IndexName: 'status-rating-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'approved',
      },
      ScanIndexForward: false, // Sort by rating descending
    };
    
    if (category) {
      queryParams.FilterExpression = 'contains(categories, :category)';
      queryParams.ExpressionAttributeValues[':category'] = category;
    }
    
    const result = await docClient.send(new QueryCommand(queryParams));
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
      while (weightedImages[idx2].id === weightedImages[idx1].id) {
        idx2 = Math.floor(Math.random() * weightedImages.length);
      }
      
      image1 = weightedImages[idx1];
      image2 = weightedImages[idx2];
      
      const pairKey = [image1.id, image2.id].sort().join('-');
      
      if (!votedPairs.has(pairKey)) {
        break;
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    // Transform URLs to use CloudFront if available
    const transformImageUrl = (image: any) => {
      if (cloudfrontUrl && image.url) {
        // Assuming images are stored with keys like "images/imageId.jpg"
        const urlParts = image.url.split('/');
        const key = urlParts.slice(-2).join('/'); // Get last two parts (e.g., "images/abc123.jpg")
        image.url = `https://${cloudfrontUrl}/${key}`;
      }
      if (cloudfrontUrl && image.thumbnailUrl) {
        const urlParts = image.thumbnailUrl.split('/');
        const key = urlParts.slice(-2).join('/');
        image.thumbnailUrl = `https://${cloudfrontUrl}/${key}`;
      }
      return image;
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [transformImageUrl(image1), transformImageUrl(image2)],
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