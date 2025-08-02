import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  
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
    
    // Save vote to main table
    await docClient.send(new PutCommand({
      TableName: process.env.VOTING_TABLE_NAME,
      Item: {
        PK: `VOTE#${voteId}`,
        SK: `USER#${userId}`,
        GSI1PK: `USER#${userId}`,
        GSI1SK: `VOTE#${timestamp}`,
        GSI2PK: `IMAGE#${winnerId}`,
        GSI2SK: `VOTE#${timestamp}`,
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
      TableName: process.env.VOTING_TABLE_NAME,
      Key: { 
        PK: `IMAGE#${winnerId}`,
        SK: `METADATA`
      },
      UpdateExpression: 'ADD voteCount :inc, winCount :inc SET rating = winCount / voteCount',
      ExpressionAttributeValues: { ':inc': 1 },
    }));
    
    // Update loser image stats
    await docClient.send(new UpdateCommand({
      TableName: process.env.VOTING_TABLE_NAME,
      Key: { 
        PK: `IMAGE#${loserId}`,
        SK: `METADATA`
      },
      UpdateExpression: 'ADD voteCount :inc SET rating = winCount / voteCount',
      ExpressionAttributeValues: { ':inc': 1 },
    }));
    
    // Update user stats
    await docClient.send(new UpdateCommand({
      TableName: process.env.VOTING_TABLE_NAME,
      Key: { 
        PK: `USER#${userId}`,
        SK: `PROFILE`
      },
      UpdateExpression: 'ADD totalVotes :inc SET lastVoteDate = :date',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':date': timestamp,
      },
    }));
    
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