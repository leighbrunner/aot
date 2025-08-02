import { defineFunction } from '@aws-amplify/backend';

export const adminOperations = defineFunction({
  name: 'adminOperations',
  runtime: 20,
  memoryMB: 512,
  timeoutSeconds: 30,
  environment: {
    IMAGES_TABLE_NAME: '',
    VOTES_TABLE_NAME: '',
    USERS_TABLE_NAME: '',
    ANALYTICS_TABLE_NAME: '',
    CATEGORIES_TABLE_NAME: '',
  },
});