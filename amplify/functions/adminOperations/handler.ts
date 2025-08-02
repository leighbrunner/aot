import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Admin operation request:', event);
  
  // Verify admin role
  const groups = event.requestContext.authorizer?.claims?.['cognito:groups'] || [];
  if (!groups.includes('Admin')) {
    return {
      statusCode: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Forbidden: Admin access required' }),
    };
  }
  
  const adminId = event.requestContext.authorizer?.claims?.sub || 'unknown';
  const operation = event.pathParameters?.operation;
  
  try {
    switch (operation) {
      case 'stats':
        return await getAdminStats();
        
      case 'pending-images':
        return await getPendingImages();
        
      case 'approve-image':
        return await approveImage(event, adminId);
        
      case 'reject-image':
        return await rejectImage(event, adminId);
        
      case 'set-promotion':
        return await setPromotionWeight(event, adminId);
        
      case 'categories':
        return await manageCategories(event, adminId);
        
      case 'generate-content':
        return await triggerContentGeneration(event, adminId);
        
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Invalid operation' }),
        };
    }
  } catch (error) {
    console.error('Admin operation error:', error);
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

async function getAdminStats() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Get user stats
    const userStats = await docClient.send(new ScanCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Select: 'COUNT',
    }));
    
    // Get active users (users who voted in last 24h)
    const activeUsersResult = await docClient.send(new QueryCommand({
      TableName: process.env.USERS_TABLE_NAME,
      IndexName: 'usersByLastVote',
      KeyConditionExpression: 'lastVoteDate > :yesterday',
      ExpressionAttributeValues: {
        ':yesterday': yesterday,
      },
      Select: 'COUNT',
    }));
    
    // Get vote counts
    const totalVotesResult = await docClient.send(new ScanCommand({
      TableName: process.env.VOTES_TABLE_NAME,
      Select: 'COUNT',
    }));
    
    // Get today's votes
    const todayVotesResult = await docClient.send(new QueryCommand({
      TableName: process.env.ANALYTICS_TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'ANALYTICS#global#day',
        ':sk': `ITEM#total#${today}`,
      },
    }));
    
    // Get image counts
    const totalImagesResult = await docClient.send(new ScanCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Select: 'COUNT',
    }));
    
    // Get pending images
    const pendingImagesResult = await docClient.send(new QueryCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      IndexName: 'imagesByStatus',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'pending',
      },
      Select: 'COUNT',
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        totalUsers: userStats.Count || 0,
        activeUsers24h: activeUsersResult.Count || 0,
        totalVotes: totalVotesResult.Count || 0,
        votesToday: todayVotesResult.Items?.[0]?.voteCount || 0,
        totalImages: totalImagesResult.Count || 0,
        pendingImages: pendingImagesResult.Count || 0,
      }),
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
}

async function getPendingImages() {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      IndexName: 'imagesByStatus',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'pending',
      },
      Limit: 50,
      ScanIndexForward: false, // newest first
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: result.Items || [],
        nextToken: result.LastEvaluatedKey ? 
          Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : 
          null,
      }),
    };
  } catch (error) {
    console.error('Error getting pending images:', error);
    throw error;
  }
}

async function approveImage(event: any, adminId: string) {
  const body = JSON.parse(event.body || '{}');
  const { imageId, categories } = body;
  
  if (!imageId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'imageId is required' }),
    };
  }
  
  try {
    const now = new Date().toISOString();
    
    // Update image status
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { id: imageId },
      UpdateExpression: 'SET #status = :status, approvedAt = :approvedAt, approvedBy = :approvedBy, categories = :categories',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'approved',
        ':approvedAt': now,
        ':approvedBy': adminId,
        ':categories': categories || [],
      },
    }));
    
    // Log admin action
    await logAdminAction(adminId, 'approve', 'image', imageId, { categories });
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error approving image:', error);
    throw error;
  }
}

async function rejectImage(event: any, adminId: string) {
  const body = JSON.parse(event.body || '{}');
  const { imageId, reason } = body;
  
  if (!imageId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'imageId is required' }),
    };
  }
  
  try {
    const now = new Date().toISOString();
    
    // Update image status
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { id: imageId },
      UpdateExpression: 'SET #status = :status, rejectedAt = :rejectedAt, rejectedBy = :rejectedBy',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'rejected',
        ':rejectedAt': now,
        ':rejectedBy': adminId,
      },
    }));
    
    // Log admin action
    await logAdminAction(adminId, 'reject', 'image', imageId, { reason });
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error rejecting image:', error);
    throw error;
  }
}

async function setPromotionWeight(event: any, adminId: string) {
  const body = JSON.parse(event.body || '{}');
  const { imageId, weight } = body;
  
  if (!imageId || weight === undefined) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'imageId and weight are required' }),
    };
  }
  
  try {
    // Update promotion weight
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { id: imageId },
      UpdateExpression: 'SET promotionWeight = :weight',
      ExpressionAttributeValues: {
        ':weight': weight,
      },
    }));
    
    // Log admin action
    await logAdminAction(adminId, 'promote', 'image', imageId, { weight });
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error setting promotion weight:', error);
    throw error;
  }
}

async function manageCategories(event: any, adminId: string) {
  const method = event.httpMethod;
  
  if (method === 'GET') {
    // Get all categories
    try {
      const result = await docClient.send(new ScanCommand({
        TableName: process.env.CATEGORIES_TABLE_NAME,
      }));
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories: result.Items || [] }),
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  } else if (method === 'POST') {
    // Create or update category
    const body = JSON.parse(event.body || '{}');
    const { categoryId, displayName, type, options, isActive } = body;
    
    if (!categoryId || !displayName || !type || !options) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }
    
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.CATEGORIES_TABLE_NAME,
        Item: {
          id: categoryId,
          displayName,
          type,
          options,
          isActive: isActive !== false,
          createdBy: adminId,
          createdAt: new Date().toISOString(),
        },
      }));
      
      // Log admin action
      await logAdminAction(adminId, 'create', 'category', categoryId, { displayName, type, options });
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success: true }),
      };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }
  
  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}

async function triggerContentGeneration(event: any, adminId: string) {
  const body = JSON.parse(event.body || '{}');
  const { characterName, count = 5, categories = [] } = body;
  
  if (!characterName) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'characterName is required' }),
    };
  }
  
  try {
    // In production, this would trigger an AI generation Lambda
    console.log('Triggering content generation:', { characterName, count, categories });
    
    // Log admin action
    await logAdminAction(adminId, 'generate', 'content', characterName, { count, categories });
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true,
        message: `Content generation triggered for ${characterName}`,
        jobId: `job-${Date.now()}`,
      }),
    };
  } catch (error) {
    console.error('Error triggering content generation:', error);
    throw error;
  }
}

async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: any
) {
  try {
    await docClient.send(new PutCommand({
      TableName: process.env.ADMIN_ACTIONS_TABLE_NAME || process.env.ANALYTICS_TABLE_NAME,
      Item: {
        PK: `ADMIN_ACTION#${adminId}`,
        SK: `ACTION#${new Date().toISOString()}#${Math.random().toString(36).substr(2, 9)}`,
        adminId,
        action,
        targetType,
        targetId,
        metadata,
        timestamp: new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failures shouldn't block operations
  }
}