import { EnvConfig } from '../env';

export const productionConfig: Partial<EnvConfig> = {
  API_ENDPOINT: 'https://api.assortits.com',
  S3_BUCKET: 'assortits-prod-images',
  CLOUDFRONT_URL: 'https://d2prod.cloudfront.net',
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_ANALYTICS: true,
  ENABLE_ADS: false, // Will be enabled in Phase 2
};