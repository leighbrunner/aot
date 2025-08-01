import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { winnerId, loserId, category, sessionId } = body;
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';
    
    // Validate input
    if (!winnerId || !loserId || !category || !sessionId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }
    
    // Create vote record
    const voteId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    await docClient.send(new PutCommand({
      TableName: process.env.VOTES_TABLE_NAME,
      Item: {
        voteId,
        userId,
        winnerId,
        loserId,
        category,
        sessionId,
        timestamp,
        country: event.headers['CloudFront-Viewer-Country'] || 'Unknown',
      },
    }));
    
    // Update winner image stats
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { imageId: winnerId },
      UpdateExpression: 'ADD voteCount :inc, winCount :inc SET rating = winCount / voteCount',
      ExpressionAttributeValues: { ':inc': 1 },
    }));
    
    // Update loser image stats
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { imageId: loserId },
      UpdateExpression: 'ADD voteCount :inc SET rating = winCount / voteCount',
      ExpressionAttributeValues: { ':inc': 1 },
    }));
    
    // Update user stats
    await docClient.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { userId },
      UpdateExpression: 'ADD stats.totalVotes :inc SET stats.lastVoteDate = :date',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':date': timestamp,
      },
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        voteId,
        message: 'Vote recorded successfully',
      }),
    };
  } catch (error) {
    console.error('Error submitting vote:', error);
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