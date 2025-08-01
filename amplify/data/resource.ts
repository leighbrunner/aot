import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Define your data model and authorization rules
 * @see https://docs.amplify.aws/react-native/build-a-backend/data/data-modeling
 */
const schema = a.schema({
  // Placeholder schema - will be fully implemented in Phase 2
  Vote: a
    .model({
      id: a.id(),
      userId: a.string(),
      winnerId: a.string(),
      loserId: a.string(),
      category: a.string(),
      timestamp: a.datetime(),
    })
    .authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});