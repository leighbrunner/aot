import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandler = async (event) => {
  // Check if user is admin
  const groups = event.requestContext.authorizer?.claims?.['cognito:groups'] || [];
  if (!groups.includes('Admin')) {
    return {
      statusCode: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const path = event.path;
  const method = event.httpMethod;

  try {
    // Route to appropriate handler
    if (path.includes('/images/pending') && method === 'GET') {
      return await getPendingImages();
    } else if (path.includes('/images/') && path.includes('/approve') && method === 'PUT') {
      return await approveImage(event);
    } else if (path.includes('/images/') && path.includes('/reject') && method === 'PUT') {
      return await rejectImage(event);
    } else if (path.includes('/categories') && method === 'GET') {
      return await getCategories();
    } else if (path.includes('/categories') && method === 'POST') {
      return await createCategory(event);
    } else if (path.includes('/analytics/overview') && method === 'GET') {
      return await getAnalyticsOverview();
    }

    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Admin API error:', error);
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

async function getPendingImages() {
  const result = await docClient.send(new QueryCommand({
    TableName: process.env.VOTING_TABLE_NAME,
    IndexName: 'GSI3',
    KeyConditionExpression: 'GSI3PK = :status',
    ExpressionAttributeValues: {
      ':status': 'STATUS#pending',
    },
    Limit: 50,
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    }),
  };
}

async function approveImage(event: any) {
  const imageId = event.pathParameters?.imageId;
  const body = JSON.parse(event.body || '{}');
  const adminId = event.requestContext.authorizer?.claims?.sub;

  await docClient.send(new UpdateCommand({
    TableName: process.env.VOTING_TABLE_NAME,
    Key: {
      PK: `IMAGE#${imageId}`,
      SK: 'METADATA',
    },
    UpdateExpression: 'SET #status = :status, approvedAt = :timestamp, approvedBy = :admin, categories = :categories, metadata = :metadata',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'approved',
      ':timestamp': new Date().toISOString(),
      ':admin': adminId,
      ':categories': body.categories || [],
      ':metadata': body.metadata || {},
    },
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true }),
  };
}

async function rejectImage(event: any) {
  const imageId = event.pathParameters?.imageId;
  const adminId = event.requestContext.authorizer?.claims?.sub;

  await docClient.send(new UpdateCommand({
    TableName: process.env.VOTING_TABLE_NAME,
    Key: {
      PK: `IMAGE#${imageId}`,
      SK: 'METADATA',
    },
    UpdateExpression: 'SET #status = :status, rejectedAt = :timestamp, rejectedBy = :admin',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'rejected',
      ':timestamp': new Date().toISOString(),
      ':admin': adminId,
    },
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true }),
  };
}

async function getCategories() {
  const result = await docClient.send(new QueryCommand({
    TableName: process.env.CATEGORIES_TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': 'CATEGORY',
    },
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      categories: result.Items || [],
    }),
  };
}

async function createCategory(event: any) {
  const body = JSON.parse(event.body || '{}');
  const categoryId = `cat_${Date.now()}`;
  const adminId = event.requestContext.authorizer?.claims?.sub;

  await docClient.send(new PutCommand({
    TableName: process.env.CATEGORIES_TABLE_NAME,
    Item: {
      PK: 'CATEGORY',
      SK: `CATEGORY#${categoryId}`,
      categoryId,
      displayName: body.displayName,
      type: body.type,
      options: body.options || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: adminId,
    },
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true, categoryId }),
  };
}

async function getAnalyticsOverview() {
  // Get total votes
  const votesResult = await docClient.send(new QueryCommand({
    TableName: process.env.ANALYTICS_TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': 'ANALYTICS#all#all',
    },
  }));

  // Get today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayResult = await docClient.send(new QueryCommand({
    TableName: process.env.ANALYTICS_TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `ANALYTICS#day#${today}`,
    },
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      totalVotes: votesResult.Items?.[0]?.voteCount || 0,
      todayVotes: todayResult.Items?.[0]?.voteCount || 0,
      activeUsers: Math.floor(Math.random() * 1000), // Would be calculated from sessions
      pendingImages: Math.floor(Math.random() * 50), // Would be queried
    }),
  };
}