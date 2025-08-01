import { defineFunction } from '@aws-amplify/backend'

export const analyticsAggregator = defineFunction({
  name: 'analyticsAggregator',
  runtime: 20,
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 1024,
  environment: {
    VOTES_TABLE_NAME: process.env.VOTES_TABLE_NAME || '',
    ANALYTICS_TABLE_NAME: process.env.ANALYTICS_TABLE_NAME || '',
    IMAGES_TABLE_NAME: process.env.IMAGES_TABLE_NAME || '',
  },
  schedule: 'rate(1 hour)', // Run every hour
})