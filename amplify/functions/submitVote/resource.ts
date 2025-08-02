import { defineFunction } from '@aws-amplify/backend';

export const submitVote = defineFunction({
  name: 'submitVote',
  runtime: 20,
  environment: {
    VOTING_TABLE_NAME: '',
    ANALYTICS_TABLE_NAME: '',
    CATEGORIES_TABLE_NAME: '',
  },
  timeoutSeconds: 30,
  memoryMB: 512,
});