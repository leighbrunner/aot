import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { winnerId, loserId, category, sessionId } = body;
    const userId = event.requestContext.authorizer?.claims?.sub || 
                  event.headers['x-anonymous-id'] || 
                  'anonymous';
    
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
    const voteId = randomUUID();
    const timestamp = new Date().toISOString();
    
    // Save vote to Votes table
    await docClient.send(new PutCommand({
      TableName: process.env.VOTES_TABLE_NAME,
      Item: {
        id: voteId,
        voteId,
        userId,
        winnerId,
        loserId,
        category,
        sessionId,
        country: event.headers['CloudFront-Viewer-Country'] || 
                event.headers['X-Forwarded-For']?.split(',')[0] || 
                'Unknown',
        createdAt: timestamp,
        updatedAt: timestamp,
        __typename: 'Vote',
      },
      ConditionExpression: 'attribute_not_exists(id)',
    }));
    
    // Update winner image stats
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { 
        id: winnerId,
      },
      UpdateExpression: 'ADD voteCount :inc, winCount :inc SET rating = winCount / voteCount, updatedAt = :timestamp',
      ExpressionAttributeValues: { 
        ':inc': 1,
        ':timestamp': timestamp,
      },
    }));
    
    // Update loser image stats  
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { 
        id: loserId,
      },
      UpdateExpression: 'ADD voteCount :inc SET rating = CASE WHEN winCount = :zero THEN :zero ELSE winCount / voteCount END, updatedAt = :timestamp',
      ExpressionAttributeValues: { 
        ':inc': 1,
        ':zero': 0,
        ':timestamp': timestamp,
      },
    }));
    
    // Update user stats if user exists
    if (userId !== 'anonymous') {
      try {
        // First check if user exists
        const userResult = await docClient.send(new GetCommand({
          TableName: process.env.USERS_TABLE_NAME,
          Key: { id: userId },
        }));
        
        if (userResult.Item) {
          const currentStats = userResult.Item.stats || {};
          const updatedStats = {
            ...currentStats,
            totalVotes: (currentStats.totalVotes || 0) + 1,
            lastVoteDate: timestamp,
          };
          
          await docClient.send(new UpdateCommand({
            TableName: process.env.USERS_TABLE_NAME,
            Key: { id: userId },
            UpdateExpression: 'SET stats = :stats, updatedAt = :timestamp',
            ExpressionAttributeValues: {
              ':stats': updatedStats,
              ':timestamp': timestamp,
            },
          }));
        }
      } catch (error) {
        console.error('Error updating user stats:', error);
        // Continue even if user update fails
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Vote processed in ${duration}ms`);
    
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