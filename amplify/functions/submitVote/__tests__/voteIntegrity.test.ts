import { handler } from '../handler';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

const mockSend = jest.fn();
const mockFrom = jest.fn(() => ({ send: mockSend }));
(DynamoDBDocumentClient.from as jest.Mock) = mockFrom;

describe('Vote Integrity Tests', () => {
  const createMockEvent = (body: any, headers: any = {}): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/vote',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      authorizer: {
        claims: {
          sub: 'test-user-123',
        },
      },
      protocol: 'HTTP/1.1',
      httpMethod: 'POST',
      path: '/vote',
      stage: 'test',
      requestId: 'test-request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: '/vote',
      identity: {
        cognitoIdentityPoolId: null,
        accountId: null,
        cognitoIdentityId: null,
        caller: null,
        sourceIp: '127.0.0.1',
        principalOrgId: null,
        accessKey: null,
        cognitoAuthenticationType: null,
        cognitoAuthenticationProvider: null,
        userArn: null,
        userAgent: 'test-agent',
        user: null,
        apiKey: null,
        apiKeyId: null,
        clientCert: null,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VOTES_TABLE_NAME = 'test-votes-table';
    process.env.IMAGES_TABLE_NAME = 'test-images-table';
    process.env.USERS_TABLE_NAME = 'test-users-table';
    process.env.ANALYTICS_TABLE_NAME = 'test-analytics-table';
  });

  describe('Input Validation', () => {
    it('should reject vote with missing winnerId', async () => {
      const event = createMockEvent({
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      const result = await handler(event) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Missing required fields',
      });
    });

    it('should reject vote with missing loserId', async () => {
      const event = createMockEvent({
        winnerId: 'image1',
        category: 'test',
        sessionId: 'session123',
      });

      const result = await handler(event) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Missing required fields',
      });
    });

    it('should reject vote with empty category', async () => {
      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: '',
        sessionId: 'session123',
      });

      const result = await handler(event) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Missing required fields',
      });
    });
  });

  describe('Duplicate Vote Prevention', () => {
    it('should prevent duplicate votes within time window', async () => {
      // Mock duplicate vote check to return true
      mockSend.mockResolvedValueOnce({
        Items: [{ voteId: 'existing-vote' }],
      });

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      const result = await handler(event) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(409);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Duplicate vote detected');
      expect(body.message).toBe('You have already voted on this pair recently');
    });

    it('should allow votes on same images but reversed', async () => {
      // Mock no duplicate found
      mockSend.mockResolvedValueOnce({ Items: [] });
      // Mock successful vote creation
      mockSend.mockResolvedValue({});

      const event = createMockEvent({
        winnerId: 'image2', // Reversed from previous test
        loserId: 'image1',
        category: 'test',
        sessionId: 'session123',
      });

      const result = await handler(event) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.voteId).toBeDefined();
    });
  });

  describe('Vote Atomicity', () => {
    it('should create vote record with all required fields', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] }); // No duplicates
      mockSend.mockResolvedValue({}); // All other operations succeed

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      await handler(event);

      // Check vote record creation
      const voteCreateCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-votes-table' && call[0].constructor.name === 'PutCommand'
      );
      
      expect(voteCreateCall).toBeDefined();
      const voteItem = voteCreateCall[0].input.Item;
      expect(voteItem).toMatchObject({
        userId: 'test-user-123',
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
        __typename: 'Vote',
      });
      expect(voteItem.id).toBeDefined();
      expect(voteItem.voteId).toBeDefined();
      expect(voteItem.createdAt).toBeDefined();
    });

    it('should update winner and loser image stats', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] }); // No duplicates
      mockSend.mockResolvedValue({}); // All operations succeed

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      await handler(event);

      // Check winner update
      const winnerUpdateCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-images-table' && 
                call[0].input.Key?.id === 'image1'
      );
      expect(winnerUpdateCall).toBeDefined();
      expect(winnerUpdateCall[0].input.UpdateExpression).toContain('ADD voteCount :inc, winCount :inc');

      // Check loser update
      const loserUpdateCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-images-table' && 
                call[0].input.Key?.id === 'image2'
      );
      expect(loserUpdateCall).toBeDefined();
      expect(loserUpdateCall[0].input.UpdateExpression).toContain('ADD voteCount :inc');
    });
  });

  describe('Analytics Tracking', () => {
    it('should track daily image analytics', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      mockSend.mockResolvedValue({});

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      await handler(event);

      const analyticsCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-analytics-table' &&
                call[0].input.Key?.PK === 'ANALYTICS#image#day'
      );

      expect(analyticsCall).toBeDefined();
      expect(analyticsCall[0].input.UpdateExpression).toContain('ADD voteCount :inc, winCount :inc');
    });

    it('should track category analytics', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      mockSend.mockResolvedValue({});

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test-category',
        sessionId: 'session123',
      });

      await handler(event);

      const categoryAnalyticsCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-analytics-table' &&
                call[0].input.Key?.PK === 'ANALYTICS#category#day'
      );

      expect(categoryAnalyticsCall).toBeDefined();
      expect(categoryAnalyticsCall[0].input.Key.SK).toContain('test-category');
    });
  });

  describe('User Stats and Streaks', () => {
    it('should update user streak correctly for consecutive days', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      mockSend.mockResolvedValueOnce({ Items: [] }); // No duplicates
      mockSend.mockResolvedValueOnce({ // Get user
        Item: {
          id: 'test-user-123',
          stats: {
            totalVotes: 10,
            currentStreak: 5,
            longestStreak: 10,
            lastVoteDate: yesterday.toISOString(),
          },
        },
      });
      mockSend.mockResolvedValue({});

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      await handler(event);

      const userUpdateCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-users-table' &&
                call[0].constructor.name === 'UpdateCommand'
      );

      expect(userUpdateCall).toBeDefined();
      const stats = userUpdateCall[0].input.ExpressionAttributeValues[':stats'];
      expect(stats.currentStreak).toBe(6); // Incremented
      expect(stats.longestStreak).toBe(10); // Unchanged
      expect(stats.totalVotes).toBe(11);
    });

    it('should reset streak for non-consecutive days', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      mockSend.mockResolvedValueOnce({ Items: [] });
      mockSend.mockResolvedValueOnce({
        Item: {
          id: 'test-user-123',
          stats: {
            totalVotes: 10,
            currentStreak: 5,
            longestStreak: 10,
            lastVoteDate: threeDaysAgo.toISOString(),
          },
        },
      });
      mockSend.mockResolvedValue({});

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      await handler(event);

      const userUpdateCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-users-table' &&
                call[0].constructor.name === 'UpdateCommand'
      );

      const stats = userUpdateCall[0].input.ExpressionAttributeValues[':stats'];
      expect(stats.currentStreak).toBe(1); // Reset to 1
      expect(stats.longestStreak).toBe(10); // Unchanged
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      const result = await handler(event) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Internal server error',
      });
    });

    it('should continue processing if analytics update fails', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] }); // No duplicates
      mockSend.mockResolvedValueOnce({}); // Vote creation succeeds
      mockSend.mockResolvedValueOnce({}); // Winner update succeeds
      mockSend.mockResolvedValueOnce({}); // Loser update succeeds
      mockSend.mockRejectedValue(new Error('Analytics error')); // Analytics fail

      const event = createMockEvent({
        winnerId: 'image1',
        loserId: 'image2',
        category: 'test',
        sessionId: 'session123',
      });

      const result = await handler(event) as APIGatewayProxyResult;
      
      // Should still succeed even if analytics fail
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Anonymous User Handling', () => {
    it('should accept votes from anonymous users', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      mockSend.mockResolvedValue({});

      const event = createMockEvent(
        {
          winnerId: 'image1',
          loserId: 'image2',
          category: 'test',
          sessionId: 'session123',
        },
        {
          'x-anonymous-id': 'anon-123',
        }
      );
      // Remove authenticated user
      event.requestContext.authorizer = undefined;

      const result = await handler(event) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(200);
      
      const voteCreateCall = mockSend.mock.calls.find(
        call => call[0].input.TableName === 'test-votes-table' && call[0].constructor.name === 'PutCommand'
      );
      expect(voteCreateCall[0].input.Item.userId).toBe('anon-123');
    });
  });
});