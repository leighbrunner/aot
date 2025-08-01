import { defineFunction } from '@aws-amplify/backend'

export const setImagePromotion = defineFunction({
  name: 'setImagePromotion',
  runtime: 20,
  timeoutSeconds: 30,
  memoryMB: 512,
  environment: {
    IMAGES_TABLE_NAME: process.env.IMAGES_TABLE_NAME || '',
  },
})