import { handler } from '../handler';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/lib-dynamodb');

describe('submitVote Lambda Handler', () => {
  let mockDocClient: jest.Mocked<DynamoDBDocumentClient>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock DynamoDB client
    mockDocClient = {
      send: jest.fn(),
    } as any;
    
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDocClient);
    
    // Set environment variables
    process.env.VOTES_TABLE_NAME = 'VotesTable';
    process.env.IMAGES_TABLE_NAME = 'ImagesTable';
    process.env.USERS_TABLE_NAME = 'UsersTable';
    process.env.ANALYTICS_TABLE_NAME = 'AnalyticsTable';
  });

  const createMockEvent = (body: any, headers: any = {}): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
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
      apiId: 'api-id',
      authorizer: {
        claims: {
          sub: 'user-123',
        },
      },
      protocol: 'HTTP/1.1',
      httpMethod: 'POST',
      path: '/vote',
      stage: 'test',
      requestId: 'request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'resource-id',
      resourcePath: '/vote',
      domainName: 'api.example.com',
      domainPrefix: 'api',
      identity: {
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'Custom User Agent String',
        userArn: null,
        clientCert: null,
        accessKey: null,
      },
    },
    resource: '/vote',
  });

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'submitVote',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:submitVote',
    memoryLimitInMB: '128',
    awsRequestId: 'request-id',
    logGroupName: '/aws/lambda/submitVote',
    logStreamName: '2024/01/01/[$LATEST]stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  };

  it('successfully submits a vote', async () => {
    // Mock duplicate check - no duplicates found
    mockDocClient.send.mockImplementation((command) => {
      if (command instanceof QueryCommand) {
        return Promise.resolve({ Items: [] });
      }
      if (command instanceof PutCommand) {
        return Promise.resolve({});
      }
      if (command instanceof UpdateCommand) {
        return Promise.resolve({});
      }
      if (command instanceof GetCommand) {
        return Promise.resolve({
          Item: {
            id: 'user-123',
            stats: {
              totalVotes: 10,
              currentStreak: 1,
              longestStreak: 5,
              lastVoteDate: new Date().toISOString(),
            },
          },
        });
      }
      return Promise.resolve({});
    });

    const event = createMockEvent({
      winnerId: 'image-1',
      loserId: 'image-2',
      category: 'category1',
      sessionId: 'session-123',
    });

    const response = await handler(event, mockContext);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.voteId).toBeDefined();
    expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
  });

  it('returns 400 for missing required fields', async () => {
    const event = createMockEvent({
      winnerId: 'image-1',
      // Missing loserId, category, sessionId
    });

    const response = await handler(event, mockContext);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error).toBe('Missing required fields');
    expect(mockDocClient.send).not.toHaveBeenCalled();
  });

  it('returns 409 for duplicate vote', async () => {
    // Mock duplicate check - duplicate found
    mockDocClient.send.mockImplementation((command) => {
      if (command instanceof QueryCommand) {
        return Promise.resolve({
          Items: [{
            voteId: 'existing-vote',
            winnerId: 'image-1',
            loserId: 'image-2',
          }],
        });
      }
      return Promise.resolve({});
    });

    const event = createMockEvent({
      winnerId: 'image-1',
      loserId: 'image-2',
      category: 'category1',
      sessionId: 'session-123',
    });

    const response = await handler(event, mockContext);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(409);
    expect(body.error).toBe('Duplicate vote detected');
    expect(body.message).toBe('You have already voted on this pair recently');
  });

  it('handles anonymous users', async () => {
    mockDocClient.send.mockImplementation((command) => {
      if (command instanceof QueryCommand) {
        return Promise.resolve({ Items: [] });
      }
      return Promise.resolve({});
    });

    const event = createMockEvent(
      {
        winnerId: 'image-1',
        loserId: 'image-2',
        category: 'category1',
        sessionId: 'session-123',
      },
      {
        'x-anonymous-id': 'anon-123',
      }
    );

    // Remove authenticated user
    event.requestContext.authorizer = undefined;

    const response = await handler(event, mockContext);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    
    // Check that user stats update was not called for anonymous user
    const updateCommands = (mockDocClient.send as jest.Mock).mock.calls
      .filter(call => call[0] instanceof UpdateCommand)
      .filter(call => call[0].input.TableName === process.env.USERS_TABLE_NAME);
    
    expect(updateCommands).toHaveLength(0);
  });

  it('updates user streak correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockDocClient.send.mockImplementation((command) => {
      if (command instanceof QueryCommand) {
        return Promise.resolve({ Items: [] });
      }
      if (command instanceof GetCommand) {
        return Promise.resolve({
          Item: {
            id: 'user-123',
            stats: {
              totalVotes: 10,
              currentStreak: 5,
              longestStreak: 5,
              lastVoteDate: yesterday.toISOString(),
            },
          },
        });
      }
      return Promise.resolve({});
    });

    const event = createMockEvent({
      winnerId: 'image-1',
      loserId: 'image-2',
      category: 'category1',
      sessionId: 'session-123',
    });

    const response = await handler(event, mockContext);

    expect(response.statusCode).toBe(200);
    
    // Find the user stats update command
    const userUpdateCall = (mockDocClient.send as jest.Mock).mock.calls
      .find(call => 
        call[0] instanceof UpdateCommand && 
        call[0].input.TableName === process.env.USERS_TABLE_NAME
      );
    
    expect(userUpdateCall).toBeDefined();
    const updateCommand = userUpdateCall[0] as UpdateCommand;
    const stats = updateCommand.input.ExpressionAttributeValues![':stats'];
    
    expect(stats.currentStreak).toBe(6); // Incremented from 5
    expect(stats.longestStreak).toBe(6); // Updated to new max
    expect(stats.totalVotes).toBe(11); // Incremented from 10
  });

  it('handles DynamoDB errors gracefully', async () => {
    mockDocClient.send.mockRejectedValue(new Error('DynamoDB error'));

    const event = createMockEvent({
      winnerId: 'image-1',
      loserId: 'image-2',
      category: 'category1',
      sessionId: 'session-123',
    });

    const response = await handler(event, mockContext);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
    expect(body.error).toBe('Internal server error');
  });

  it('includes country information from CloudFront headers', async () => {
    mockDocClient.send.mockImplementation((command) => {
      if (command instanceof QueryCommand) {
        return Promise.resolve({ Items: [] });
      }
      return Promise.resolve({});
    });

    const event = createMockEvent(
      {
        winnerId: 'image-1',
        loserId: 'image-2',
        category: 'category1',
        sessionId: 'session-123',
      },
      {
        'CloudFront-Viewer-Country': 'US',
      }
    );

    const response = await handler(event, mockContext);

    expect(response.statusCode).toBe(200);
    
    // Find the vote creation command
    const voteCreateCall = (mockDocClient.send as jest.Mock).mock.calls
      .find(call => 
        call[0] instanceof PutCommand && 
        call[0].input.TableName === process.env.VOTES_TABLE_NAME
      );
    
    expect(voteCreateCall).toBeDefined();
    const putCommand = voteCreateCall[0] as PutCommand;
    expect(putCommand.input.Item!.country).toBe('US');
  });

  it('updates analytics tables correctly', async () => {
    mockDocClient.send.mockImplementation((command) => {
      if (command instanceof QueryCommand) {
        return Promise.resolve({ Items: [] });
      }
      return Promise.resolve({});
    });

    const event = createMockEvent({
      winnerId: 'image-1',
      loserId: 'image-2',
      category: 'category1',
      sessionId: 'session-123',
    });

    const response = await handler(event, mockContext);

    expect(response.statusCode).toBe(200);
    
    // Check analytics updates
    const analyticsUpdates = (mockDocClient.send as jest.Mock).mock.calls
      .filter(call => 
        call[0] instanceof UpdateCommand && 
        call[0].input.TableName === process.env.ANALYTICS_TABLE_NAME
      );
    
    expect(analyticsUpdates).toHaveLength(2); // Image and category analytics
  });
});