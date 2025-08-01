import { defineFunction } from '@aws-amplify/backend';

export const voteStreamHandler = defineFunction({
  name: 'voteStreamHandler',
  runtime: 20,
  handler: 'handler.handler',
  environment: {
    ANALYTICS_TABLE_NAME: process.env.ANALYTICS_TABLE_NAME || '',
  },
});

// handler.ts content
export const handler = async (event: any) => {
  console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));
  
  const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
  
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);
  
  for (const record of event.Records) {
    if (record.eventName === 'INSERT' && record.dynamodb?.NewImage) {
      const vote = record.dynamodb.NewImage;
      const winnerId = vote.winnerId?.S;
      const category = vote.category?.S;
      const timestamp = vote.timestamp?.S;
      
      if (!winnerId || !category || !timestamp) continue;
      
      const voteDate = new Date(timestamp);
      const dateKeys = {
        day: voteDate.toISOString().split('T')[0],
        week: getWeekStart(voteDate),
        month: voteDate.toISOString().substring(0, 7),
        year: voteDate.getFullYear().toString(),
        all: 'all-time',
      };
      
      // Update analytics for each time period
      for (const [period, dateKey] of Object.entries(dateKeys)) {
        try {
          await docClient.send(new UpdateCommand({
            TableName: process.env.ANALYTICS_TABLE_NAME,
            Key: {
              type: 'image',
              period: `${period}#${dateKey}`,
              itemId: winnerId,
            },
            UpdateExpression: `
              ADD voteCount :inc, winCount :inc
              SET #date = :date,
                  winRate = winCount / voteCount,
                  lastUpdated = :now
            `,
            ExpressionAttributeNames: {
              '#date': 'date',
            },
            ExpressionAttributeValues: {
              ':inc': 1,
              ':date': dateKey,
              ':now': new Date().toISOString(),
            },
          }));
          
          // Also update category analytics
          await docClient.send(new UpdateCommand({
            TableName: process.env.ANALYTICS_TABLE_NAME,
            Key: {
              type: 'category',
              period: `${period}#${dateKey}`,
              itemId: category,
            },
            UpdateExpression: `
              ADD voteCount :inc
              SET #date = :date,
                  lastUpdated = :now
            `,
            ExpressionAttributeNames: {
              '#date': 'date',
            },
            ExpressionAttributeValues: {
              ':inc': 1,
              ':date': dateKey,
              ':now': new Date().toISOString(),
            },
          }));
        } catch (error) {
          console.error(`Error updating analytics for ${period}:`, error);
        }
      }
    }
  }
  
  return { status: 'processed', recordCount: event.Records.length };
};

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}