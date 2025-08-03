import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import { Platform } from 'react-native';

// Web-specific Amplify configuration without Auth
const configureAmplifyForWeb = () => {
  // Extract only the services we need on web (exclude Auth entirely)
  const webConfig = {
    API: outputs.data ? {
      GraphQL: {
        endpoint: outputs.data.url,
        region: outputs.data.aws_region,
        defaultAuthMode: outputs.data.default_authorization_type,
        apiKey: outputs.data.api_key,
      }
    } : undefined,
    Storage: outputs.storage ? {
      S3: {
        bucket: outputs.storage.bucket_name,
        region: outputs.storage.aws_region,
      }
    } : undefined,
  };

  // Only configure services that exist
  const validConfig = Object.entries(webConfig).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);

  if (Object.keys(validConfig).length > 0) {
    Amplify.configure(validConfig);
  }
};

// Only configure if we're on web
if (Platform.OS === 'web') {
  configureAmplifyForWeb();
}

export { Amplify };