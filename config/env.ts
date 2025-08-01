// Environment configuration
export interface EnvConfig {
  API_ENDPOINT: string;
  AWS_REGION: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_IDENTITY_POOL_ID: string;
  COGNITO_DOMAIN: string;
  S3_BUCKET: string;
  CLOUDFRONT_URL: string;
  ENABLE_SOCIAL_LOGIN: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_ADS: boolean;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const getBooleanEnvVar = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

export const getConfig = (): EnvConfig => ({
  API_ENDPOINT: getEnvVar('API_ENDPOINT', 'https://api-test.assortits.com'),
  AWS_REGION: getEnvVar('AWS_REGION', 'us-east-1'),
  COGNITO_USER_POOL_ID: getEnvVar('COGNITO_USER_POOL_ID', ''),
  COGNITO_CLIENT_ID: getEnvVar('COGNITO_CLIENT_ID', ''),
  COGNITO_IDENTITY_POOL_ID: getEnvVar('COGNITO_IDENTITY_POOL_ID', ''),
  COGNITO_DOMAIN: getEnvVar('COGNITO_DOMAIN', ''),
  S3_BUCKET: getEnvVar('S3_BUCKET', ''),
  CLOUDFRONT_URL: getEnvVar('CLOUDFRONT_URL', ''),
  ENABLE_SOCIAL_LOGIN: getBooleanEnvVar('ENABLE_SOCIAL_LOGIN', false),
  ENABLE_ANALYTICS: getBooleanEnvVar('ENABLE_ANALYTICS', true),
  ENABLE_ADS: getBooleanEnvVar('ENABLE_ADS', false),
});

export const config = getConfig();