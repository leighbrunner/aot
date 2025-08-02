import { defineFunction, secret } from '@aws-amplify/backend';

export const getLeaderboard = defineFunction({
  name: 'getLeaderboard',
  runtime: 20,
  entry: './handler.ts',
  environment: {
    IMAGES_TABLE_NAME: process.env.IMAGES_TABLE_NAME || '',
    ANALYTICS_TABLE_NAME: process.env.ANALYTICS_TABLE_NAME || '',
  },
  timeoutSeconds: 30,
});