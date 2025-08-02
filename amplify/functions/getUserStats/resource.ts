import { defineFunction, secret } from '@aws-amplify/backend';

export const getUserStats = defineFunction({
  name: 'getUserStats',
  runtime: 20,
  entry: './handler.ts',
  environment: {
    USERS_TABLE_NAME: process.env.USERS_TABLE_NAME || '',
    VOTES_TABLE_NAME: process.env.VOTES_TABLE_NAME || '',
    IMAGES_TABLE_NAME: process.env.IMAGES_TABLE_NAME || '',
  },
  timeoutSeconds: 30,
});