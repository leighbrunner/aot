import { EnvConfig } from '../env';

export const testConfig: Partial<EnvConfig> = {
  API_ENDPOINT: 'https://api-test.assortits.com',
  S3_BUCKET: 'assortits-test-images',
  CLOUDFRONT_URL: 'https://d1test.cloudfront.net',
  ENABLE_SOCIAL_LOGIN: false,
  ENABLE_ANALYTICS: true,
  ENABLE_ADS: false,
};