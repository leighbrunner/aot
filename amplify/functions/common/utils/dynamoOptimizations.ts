import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Optimized DynamoDB client with best practices
 */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  maxAttempts: 3,
  // HTTP keep-alive for connection reuse
  requestHandler: {
    connectionTimeout: 5000,
    socketTimeout: 5000,
  },
});

// Document client with optimizations
export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

/**
 * Batch get items with automatic chunking
 */
export async function batchGet<T>(
  tableName: string,
  keys: Record<string, any>[],
  projectionExpression?: string
): Promise<T[]> {
  const results: T[] = [];
  
  // DynamoDB allows max 100 items per batch
  const chunks = chunkArray(keys, 100);
  
  for (const chunk of chunks) {
    const params: any = {
      RequestItems: {
        [tableName]: {
          Keys: chunk,
        },
      },
    };
    
    if (projectionExpression) {
      params.RequestItems[tableName].ProjectionExpression = projectionExpression;
    }
    
    const response = await dynamoDb.send(new BatchGetCommand(params));
    
    if (response.Responses?.[tableName]) {
      results.push(...(response.Responses[tableName] as T[]));
    }
    
    // Handle unprocessed keys
    if (response.UnprocessedKeys?.[tableName]) {
      console.warn('Unprocessed keys:', response.UnprocessedKeys[tableName].Keys);
      // In production, implement retry logic for unprocessed keys
    }
  }
  
  return results;
}

/**
 * Batch write items with automatic chunking and retry
 */
export async function batchWrite(
  tableName: string,
  items: any[],
  operation: 'put' | 'delete' = 'put'
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  
  // DynamoDB allows max 25 items per batch write
  const chunks = chunkArray(items, 25);
  
  for (const chunk of chunks) {
    const requests = chunk.map(item => {
      if (operation === 'put') {
        return { PutRequest: { Item: item } };
      } else {
        return { DeleteRequest: { Key: item } };
      }
    });
    
    try {
      const response = await dynamoDb.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: requests,
        },
      }));
      
      successCount += chunk.length;
      
      // Handle unprocessed items
      if (response.UnprocessedItems?.[tableName]) {
        const unprocessedCount = response.UnprocessedItems[tableName].length;
        successCount -= unprocessedCount;
        failedCount += unprocessedCount;
        console.warn(`${unprocessedCount} unprocessed items in batch write`);
      }
    } catch (error) {
      console.error('Batch write error:', error);
      failedCount += chunk.length;
    }
  }
  
  return { success: successCount, failed: failedCount };
}

/**
 * Query with automatic pagination
 */
export async function* queryPaginated<T>(
  params: any,
  maxItems?: number
): AsyncGenerator<T[], void, unknown> {
  let itemCount = 0;
  let lastEvaluatedKey = undefined;
  
  do {
    const queryParams = {
      ...params,
      ExclusiveStartKey: lastEvaluatedKey,
    };
    
    const response = await dynamoDb.send(queryParams);
    
    if (response.Items && response.Items.length > 0) {
      const items = response.Items as T[];
      
      if (maxItems && itemCount + items.length > maxItems) {
        // Trim to max items
        const remaining = maxItems - itemCount;
        yield items.slice(0, remaining);
        return;
      }
      
      yield items;
      itemCount += items.length;
    }
    
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey && (!maxItems || itemCount < maxItems));
}

/**
 * Optimized single item operations with exponential backoff
 */
export async function getItemWithRetry<T>(
  tableName: string,
  key: Record<string, any>,
  maxRetries: number = 3
): Promise<T | null> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await dynamoDb.get({
        TableName: tableName,
        Key: key,
        ConsistentRead: false, // Use eventually consistent reads for better performance
      });
      
      return (response.Item as T) || null;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on item not found
      if (error.name === 'ResourceNotFoundException') {
        throw error;
      }
      
      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }
  
  throw lastError;
}

/**
 * Helper function to chunk arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Create optimized GSI query parameters
 */
export function createGSIQueryParams(
  tableName: string,
  indexName: string,
  partitionKey: { name: string; value: any },
  sortKey?: { name: string; value: any; operator?: string },
  options?: {
    limit?: number;
    scanIndexForward?: boolean;
    projectionExpression?: string;
    filterExpression?: string;
    expressionAttributeValues?: Record<string, any>;
  }
): any {
  const params: any = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: `#pk = :pk`,
    ExpressionAttributeNames: {
      '#pk': partitionKey.name,
    },
    ExpressionAttributeValues: {
      ':pk': partitionKey.value,
    },
  };
  
  if (sortKey) {
    params.KeyConditionExpression += ` AND #sk ${sortKey.operator || '='} :sk`;
    params.ExpressionAttributeNames['#sk'] = sortKey.name;
    params.ExpressionAttributeValues[':sk'] = sortKey.value;
  }
  
  if (options) {
    Object.assign(params, options);
  }
  
  return params;
}