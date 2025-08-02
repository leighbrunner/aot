import { defineFunction } from '@aws-amplify/backend';

export const setImagePromotion = defineFunction({
  name: 'setImagePromotion',
  runtime: 20,
  environment: {
    VOTING_TABLE_NAME: '',
    ANALYTICS_TABLE_NAME: '',
    CATEGORIES_TABLE_NAME: '',
  },
  timeoutSeconds: 30,
  memoryMB: 512,
});