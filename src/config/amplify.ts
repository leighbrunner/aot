import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Configure Amplify with error handling
export function configureAmplify() {
  try {
    // Create a clean config without OAuth
    const config = {
      Auth: {
        Cognito: {
          userPoolId: outputs.auth.user_pool_id,
          userPoolClientId: outputs.auth.user_pool_client_id,
          identityPoolId: outputs.auth.identity_pool_id,
          allowGuestAccess: outputs.auth.unauthenticated_identities_enabled,
        }
      },
      API: {
        GraphQL: {
          endpoint: outputs.data.url,
          region: outputs.data.aws_region,
          defaultAuthMode: 'userPool',
          apiKey: outputs.data.api_key,
        }
      }
    };
    
    Amplify.configure(config);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Error configuring Amplify:', error);
  }
}

export { outputs as amplifyConfig };