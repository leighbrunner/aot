import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Helper to check for duplicate votes
async function checkDuplicateVote(
  userId: string, 
  winnerId: string, 
  loserId: string,
  timeWindowMs: number = 5000 // 5 second window
): Promise<boolean> {
  const cutoffTime = new Date(Date.now() - timeWindowMs).toISOString();
  
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.VOTES_TABLE_NAME!,
      IndexName: 'userVotesIndex',
      KeyConditionExpression: 'userId = :userId AND createdAt > :cutoff',
      FilterExpression: '(winnerId = :winner1 AND loserId = :loser1) OR (winnerId = :winner2 AND loserId = :loser2)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':cutoff': cutoffTime,
        ':winner1': winnerId,
        ':loser1': loserId,
        ':winner2': loserId,
        ':loser2': winnerId,
      },
      Limit: 1,
    }));
    
    return (result.Items?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking duplicate vote:', error);
    return false; // Allow vote if check fails
  }
}

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
    
    // Check for duplicate vote
    const isDuplicate = await checkDuplicateVote(userId, winnerId, loserId);
    if (isDuplicate) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Duplicate vote detected',
          message: 'You have already voted on this pair recently'
        }),
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
    
    // Update user stats and streaks
    if (userId !== 'anonymous') {
      try {
        // First check if user exists
        const userResult = await docClient.send(new GetCommand({
          TableName: process.env.USERS_TABLE_NAME,
          Key: { id: userId },
        }));
        
        if (userResult.Item) {
          const currentStats = userResult.Item.stats || {};
          const lastVoteDate = currentStats.lastVoteDate ? new Date(currentStats.lastVoteDate) : null;
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          // Calculate streak
          let currentStreak = currentStats.currentStreak || 0;
          let longestStreak = currentStats.longestStreak || 0;
          
          if (!lastVoteDate) {
            // First vote
            currentStreak = 1;
          } else if (lastVoteDate.toDateString() === today.toDateString()) {
            // Already voted today, maintain streak
            currentStreak = Math.max(currentStreak, 1);
          } else if (lastVoteDate.toDateString() === yesterday.toDateString()) {
            // Voted yesterday, increment streak
            currentStreak += 1;
          } else {
            // Streak broken, reset to 1
            currentStreak = 1;
          }
          
          longestStreak = Math.max(currentStreak, longestStreak);
          
          const updatedStats = {
            ...currentStats,
            totalVotes: (currentStats.totalVotes || 0) + 1,
            lastVoteDate: timestamp,
            currentStreak,
            longestStreak,
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
    
    // Track analytics
    const analyticsPromises = [];
    
    // Daily analytics
    const dateKey = new Date().toISOString().split('T')[0];
    analyticsPromises.push(
      docClient.send(new UpdateCommand({
        TableName: process.env.ANALYTICS_TABLE_NAME,
        Key: {
          PK: `ANALYTICS#image#day`,
          SK: `ITEM#${winnerId}#${dateKey}`,
        },
        UpdateExpression: 'ADD voteCount :inc, winCount :inc SET #type = :type, period = :period, #date = :date, itemId = :itemId, winRate = winCount / voteCount',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#date': 'date',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':type': 'image',
          ':period': 'day',
          ':date': dateKey,
          ':itemId': winnerId,
        },
      }))
    );
    
    // Category analytics
    analyticsPromises.push(
      docClient.send(new UpdateCommand({
        TableName: process.env.ANALYTICS_TABLE_NAME,
        Key: {
          PK: `ANALYTICS#category#day`,
          SK: `ITEM#${category}#${dateKey}`,
        },
        UpdateExpression: 'ADD voteCount :inc SET #type = :type, period = :period, #date = :date, itemId = :itemId',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#date': 'date',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':type': 'category',
          ':period': 'day',
          ':date': dateKey,
          ':itemId': category,
        },
      }))
    );
    
    // Execute analytics updates in parallel
    await Promise.all(analyticsPromises).catch(error => {
      console.error('Error updating analytics:', error);
      // Continue even if analytics fail
    });
    
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