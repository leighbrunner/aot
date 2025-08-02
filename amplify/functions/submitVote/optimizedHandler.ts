import type { APIGatewayProxyHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { optimizedHandler } from '../common/utils/warmup';
import { withCache, lambdaCache } from '../common/utils/cache';
import { dynamoDb, batchWrite } from '../common/utils/dynamoOptimizations';
import { rateLimiters } from '../common/utils/rateLimiter';
import { 
  PutCommand, 
  UpdateCommand, 
  GetCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';

// Environment variables
const VOTES_TABLE = process.env.VOTES_TABLE_NAME!;
const IMAGES_TABLE = process.env.IMAGES_TABLE_NAME!;
const USERS_TABLE = process.env.USERS_TABLE_NAME!;
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE_NAME!;

// Check for duplicate votes with caching
async function checkDuplicateVote(
  userId: string, 
  winnerId: string, 
  loserId: string,
  timeWindowMs: number = 5000
): Promise<boolean> {
  const cacheKey = `dup:${userId}:${winnerId}:${loserId}`;
  
  // Check cache first
  const cached = lambdaCache.get<boolean>(cacheKey);
  if (cached !== null) return cached;
  
  const cutoffTime = new Date(Date.now() - timeWindowMs).toISOString();
  
  try {
    const result = await dynamoDb.send(new QueryCommand({
      TableName: VOTES_TABLE,
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
      ConsistentRead: false, // Eventually consistent for better performance
    }));
    
    const isDuplicate = (result.Items?.length || 0) > 0;
    
    // Cache the result for short duration
    lambdaCache.set(cacheKey, isDuplicate, timeWindowMs);
    
    return isDuplicate;
  } catch (error) {
    console.error('Error checking duplicate vote:', error);
    return false; // Allow vote if check fails
  }
}

// Optimized handler with warmup support
const baseHandler: APIGatewayProxyHandler = async (event) => {
  const startTime = Date.now();
  
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.byUser.checkLimit(event);
    if (!rateLimitResult.allowed) {
      return rateLimiters.byUser.createRateLimitResponse(
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.resetAt
      );
    }
    
    // Parse and validate input
    const body = JSON.parse(event.body || '{}');
    const { winnerId, loserId, category, sessionId } = body;
    const userId = event.requestContext.authorizer?.claims?.sub || 
                  event.headers['x-anonymous-id'] || 
                  'anonymous';
    
    if (!winnerId || !loserId || !category || !sessionId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
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
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
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
    const dateKey = timestamp.split('T')[0];
    
    // Prepare all database operations
    const operations = [];
    
    // Vote record
    operations.push({
      Put: {
        TableName: VOTES_TABLE,
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
      },
    });
    
    // Execute vote recording first (critical path)
    await dynamoDb.send(new PutCommand(operations[0].Put));
    
    // Batch update operations (non-critical, can be done async)
    const updatePromises = [];
    
    // Update winner stats
    updatePromises.push(
      dynamoDb.send(new UpdateCommand({
        TableName: IMAGES_TABLE,
        Key: { id: winnerId },
        UpdateExpression: 'ADD voteCount :inc, winCount :inc SET rating = winCount / voteCount, updatedAt = :timestamp',
        ExpressionAttributeValues: { 
          ':inc': 1,
          ':timestamp': timestamp,
        },
        ReturnValues: 'NONE', // Don't need the response
      }))
    );
    
    // Update loser stats
    updatePromises.push(
      dynamoDb.send(new UpdateCommand({
        TableName: IMAGES_TABLE,
        Key: { id: loserId },
        UpdateExpression: 'ADD voteCount :inc SET rating = CASE WHEN winCount = :zero THEN :zero ELSE winCount / voteCount END, updatedAt = :timestamp',
        ExpressionAttributeValues: { 
          ':inc': 1,
          ':zero': 0,
          ':timestamp': timestamp,
        },
        ReturnValues: 'NONE',
      }))
    );
    
    // Update user stats if not anonymous
    if (userId !== 'anonymous') {
      updatePromises.push(
        updateUserStats(userId, timestamp).catch(err => 
          console.error('User stats update failed:', err)
        )
      );
    }
    
    // Update analytics (can be done async)
    updatePromises.push(
      updateAnalytics(winnerId, category, dateKey).catch(err => 
        console.error('Analytics update failed:', err)
      )
    );
    
    // Execute all updates in parallel
    await Promise.all(updatePromises);
    
    const duration = Date.now() - startTime;
    console.log(`Vote processed in ${duration}ms`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-Processing-Time': duration.toString(),
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

// Helper function to update user stats
async function updateUserStats(userId: string, timestamp: string): Promise<void> {
  // Use caching for user data
  const userCacheKey = `user:${userId}`;
  let userItem = await withCache(
    userCacheKey,
    async () => {
      const result = await dynamoDb.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: userId },
        ProjectionExpression: 'id, stats',
      }));
      return result.Item;
    },
    300000 // 5 minute cache
  );
  
  if (!userItem) return;
  
  const currentStats = userItem.stats || {};
  const lastVoteDate = currentStats.lastVoteDate ? new Date(currentStats.lastVoteDate) : null;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Calculate streak
  let currentStreak = currentStats.currentStreak || 0;
  let longestStreak = currentStats.longestStreak || 0;
  
  if (!lastVoteDate) {
    currentStreak = 1;
  } else if (lastVoteDate.toDateString() === today.toDateString()) {
    currentStreak = Math.max(currentStreak, 1);
  } else if (lastVoteDate.toDateString() === yesterday.toDateString()) {
    currentStreak += 1;
  } else {
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
  
  // Update user stats
  await dynamoDb.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: userId },
    UpdateExpression: 'SET stats = :stats, updatedAt = :timestamp',
    ExpressionAttributeValues: {
      ':stats': updatedStats,
      ':timestamp': timestamp,
    },
    ReturnValues: 'NONE',
  }));
  
  // Invalidate cache
  lambdaCache.delete(userCacheKey);
}

// Helper function to update analytics
async function updateAnalytics(
  winnerId: string, 
  category: string, 
  dateKey: string
): Promise<void> {
  const analyticsUpdates = [];
  
  // Image analytics
  analyticsUpdates.push({
    Update: {
      TableName: ANALYTICS_TABLE,
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
    },
  });
  
  // Category analytics
  analyticsUpdates.push({
    Update: {
      TableName: ANALYTICS_TABLE,
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
    },
  });
  
  // Execute analytics updates in parallel
  await Promise.all(
    analyticsUpdates.map(update => 
      dynamoDb.send(new UpdateCommand(update.Update))
    )
  );
}

// Export the optimized handler
export const handler = optimizedHandler(baseHandler);