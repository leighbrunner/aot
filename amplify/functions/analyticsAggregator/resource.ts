import { defineFunction } from '@aws-amplify/backend';

export const analyticsAggregator = defineFunction({
  name: 'analyticsAggregator',
  runtime: 20,
  environment: {
    VOTING_TABLE_NAME: '',
    ANALYTICS_TABLE_NAME: '',
    CATEGORIES_TABLE_NAME: '',
  },
  timeoutSeconds: 300,
  memoryMB: 1024,
});