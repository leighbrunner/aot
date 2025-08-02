import { defineFunction } from '@aws-amplify/backend';

export const adminApi = defineFunction({
  name: 'adminApi',
  runtime: 20,
  environment: {
    VOTING_TABLE_NAME: '',
    ANALYTICS_TABLE_NAME: '',
    CATEGORIES_TABLE_NAME: '',
  },
  timeoutSeconds: 60,
  memoryMB: 1024,
});