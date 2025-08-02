import { APIGatewayProxyHandler } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const IMAGES_TABLE = process.env.IMAGES_TABLE_NAME!

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Set image promotion request:', event)

  // Check admin authorization
  const claims = event.requestContext.authorizer?.claims
  const groups = claims?.['cognito:groups'] || []
  
  if (!groups.includes('admins')) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Unauthorized: Admin access required' }),
    }
  }

  const imageId = event.pathParameters?.imageId
  
  if (!imageId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Image ID is required' }),
    }
  }

  const body = JSON.parse(event.body || '{}')
  const promotionWeight = body.promotionWeight

  // Validate promotion weight
  if (typeof promotionWeight !== 'number' || promotionWeight < 1 || promotionWeight > 10) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Promotion weight must be a number between 1 and 10' }),
    }
  }

  try {
    // First check if image exists and is approved
    const getResponse = await docClient.send(new GetCommand({
      TableName: IMAGES_TABLE,
      Key: {
        PK: `IMAGE#${imageId}`,
        SK: 'METADATA',
      },
    }))

    if (!getResponse.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Image not found' }),
      }
    }

    if (getResponse.Item.status !== 'approved') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Only approved images can be promoted' }),
      }
    }

    // Update promotion weight
    const updateResponse = await docClient.send(new UpdateCommand({
      TableName: IMAGES_TABLE,
      Key: {
        PK: `IMAGE#${imageId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'SET promotionWeight = :weight, promotedAt = :now, promotedBy = :user',
      ExpressionAttributeValues: {
        ':weight': promotionWeight,
        ':now': new Date().toISOString(),
        ':user': claims?.email || 'admin',
      },
      ReturnValues: 'ALL_NEW',
    }))

    // Log promotion action
    console.log('Image promotion updated:', {
      imageId,
      promotionWeight,
      promotedBy: claims?.email,
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Promotion weight updated successfully',
        image: updateResponse.Attributes,
      }),
    }
  } catch (error) {
    console.error('Error updating promotion weight:', error)
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to update promotion weight' }),
    }
  }
}