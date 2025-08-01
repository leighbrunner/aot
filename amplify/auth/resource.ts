import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/react-native/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // Social providers will be added in Phase 2
    // externalProviders: {
    //   google: {
    //     clientId: 'your-google-client-id',
    //     clientSecret: 'your-google-client-secret',
    //   },
    //   facebook: {
    //     clientId: 'your-facebook-client-id',
    //     clientSecret: 'your-facebook-client-secret',
    //   },
    //   signInWithApple: {
    //     clientId: 'your-apple-client-id',
    //     keyId: 'your-apple-key-id',
    //     privateKey: 'your-apple-private-key',
    //     teamId: 'your-apple-team-id',
    //   },
    // },
  },
  userAttributes: {
    preferredUsername: {
      mutable: true,
      required: false,
    },
  },
});