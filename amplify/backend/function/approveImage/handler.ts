import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyHandler } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const imageId = event.pathParameters?.id;
    const adminId = event.requestContext.authorizer?.claims?.sub;
    
    if (!imageId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Image ID required' }),
      };
    }
    
    const timestamp = new Date().toISOString();
    
    // Update image status in DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: process.env.IMAGES_TABLE_NAME,
      Key: { imageId },
      UpdateExpression: 'SET #status = :status, approvedAt = :timestamp, approvedBy = :adminId',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'approved',
        ':timestamp': timestamp,
        ':adminId': adminId,
      },
    }));
    
    // Move image from pending to approved in S3
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    const sourceKey = `pending/${imageId}.jpg`;
    const destKey = `approved/${imageId}.jpg`;
    
    await s3Client.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destKey,
    }));
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: sourceKey,
    }));
    
    // Also handle thumbnail
    const thumbSourceKey = `pending/thumbnails/${imageId}.jpg`;
    const thumbDestKey = `thumbnails/${imageId}.jpg`;
    
    await s3Client.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${thumbSourceKey}`,
      Key: thumbDestKey,
    }));
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: thumbSourceKey,
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        imageId,
        status: 'approved',
        approvedAt: timestamp,
        approvedBy: adminId,
      }),
    };
  } catch (error) {
    console.error('Error approving image:', error);
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