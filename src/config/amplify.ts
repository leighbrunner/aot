import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Remove OAuth configuration for web to avoid errors
const config = { ...outputs };
if (typeof window !== 'undefined') {
  // Running on web - remove OAuth config
  if (config.auth && config.auth.oauth) {
    delete config.auth.oauth;
  }
}

// Configure Amplify immediately
Amplify.configure(config);

// Export configured Amplify for other modules
export { Amplify };