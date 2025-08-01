import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Define your data model and authorization rules
 * @see https://docs.amplify.aws/react-native/build-a-backend/data/data-modeling
 */
const schema = a.schema({
  // Images Table
  Image: a
    .model({
      imageId: a.id().required(),
      url: a.string().required(),
      thumbnailUrl: a.string().required(),
      characterId: a.string().required(),
      characterName: a.string().required(),
      categories: a.string().array().required(),
      metadata: a.json(),
      status: a.enum(['pending', 'approved', 'rejected']),
      source: a.enum(['ai', 'user']),
      promotionWeight: a.integer().default(1),
      approvedAt: a.datetime(),
      approvedBy: a.string(),
      voteCount: a.integer().default(0),
      winCount: a.integer().default(0),
      rating: a.float().default(0),
    })
    .secondaryIndexes(index => [
      index('status').sortKeys(['createdAt']),
      index('categories').sortKeys(['rating']),
      index('characterId').sortKeys(['imageId']),
    ])
    .authorization(allow => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.groups(['Admin']).to(['create', 'read', 'update', 'delete']),
    ]),

  // Votes Table
  Vote: a
    .model({
      voteId: a.id().required(),
      userId: a.string().required(),
      winnerId: a.string().required(),
      loserId: a.string().required(),
      category: a.string().required(),
      sessionId: a.string().required(),
      country: a.string(),
      winnerImage: a.belongsTo('Image', 'winnerId'),
      loserImage: a.belongsTo('Image', 'loserId'),
      user: a.belongsTo('User', 'userId'),
    })
    .secondaryIndexes(index => [
      index('winnerId').sortKeys(['createdAt']),
      index('userId').sortKeys(['createdAt']),
    ])
    .authorization(allow => [
      allow.owner().identityClaim('sub'),
      allow.groups(['Admin']).to(['read', 'delete']),
    ]),

  // Users Table
  User: a
    .model({
      userId: a.id().required(),
      email: a.email(),
      username: a.string(),
      preferences: a.json(),
      stats: a.json(),
      isAnonymous: a.boolean().default(true),
      votes: a.hasMany('Vote', 'userId'),
    })
    .secondaryIndexes(index => [
      index('email').sortKeys(['userId']),
    ])
    .authorization(allow => [
      allow.owner().identityClaim('sub'),
      allow.groups(['Admin']).to(['read', 'update']),
    ]),

  // Analytics Table
  Analytics: a
    .model({
      type: a.enum(['image', 'category', 'character']),
      period: a.enum(['day', 'week', 'month', 'year', 'all']),
      date: a.string().required(),
      itemId: a.string().required(),
      voteCount: a.integer().default(0),
      winCount: a.integer().default(0),
      winRate: a.float().default(0),
    })
    .identifier(['type', 'period', 'date', 'itemId'])
    .authorization(allow => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.groups(['Admin']).to(['create', 'read', 'update', 'delete']),
    ]),

  // Categories Table
  Category: a
    .model({
      categoryId: a.id().required(),
      displayName: a.string().required(),
      type: a.enum(['physical', 'demographic', 'style']),
      options: a.string().array().required(),
      isActive: a.boolean().default(true),
      createdBy: a.string().required(),
    })
    .authorization(allow => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
      allow.groups(['Admin']).to(['create', 'read', 'update', 'delete']),
    ]),

  // Session Table for tracking voting sessions
  Session: a
    .model({
      sessionId: a.id().required(),
      userId: a.string().required(),
      startTime: a.datetime().required(),
      endTime: a.datetime(),
      voteCount: a.integer().default(0),
      platform: a.enum(['ios', 'android', 'web']),
      user: a.belongsTo('User', 'userId'),
    })
    .authorization(allow => [
      allow.owner().identityClaim('sub'),
      allow.groups(['Admin']).to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});