import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/react-native/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        attributeMapping: {
          email: 'email',
          name: 'name',
          picture: 'picture',
        },
        scopes: ['email', 'profile'],
      },
      facebook: {
        clientId: secret('FACEBOOK_CLIENT_ID'),
        clientSecret: secret('FACEBOOK_CLIENT_SECRET'),
        attributeMapping: {
          email: 'email',
          name: 'name',
        },
        scopes: ['email', 'public_profile'],
      },
      signInWithApple: {
        clientId: secret('APPLE_CLIENT_ID'),
        keyId: secret('APPLE_KEY_ID'),
        privateKey: secret('APPLE_PRIVATE_KEY'),
        teamId: secret('APPLE_TEAM_ID'),
        attributeMapping: {
          email: 'email',
          name: 'name',
        },
        scopes: ['email', 'name'],
      },
      callbackUrls: [
        'http://localhost:8083/',
        'exp://localhost:8081/',
        'voting-app://',
        'https://assortits.com/auth/callback',
        'https://kittensorpuppies.com/auth/callback',
      ],
      logoutUrls: [
        'http://localhost:8083/',
        'exp://localhost:8081/',
        'voting-app://',
        'https://assortits.com/',
        'https://kittensorpuppies.com/',
      ],
    },
  },
  userAttributes: {
    email: {
      mutable: true,
      required: false,
    },
    preferredUsername: {
      mutable: true,
      required: false,
    },
    picture: {
      mutable: true,
      required: false,
    },
    name: {
      mutable: true,
      required: false,
    },
  },
  groups: ['Admin', 'Moderator'],
  triggers: {
    preSignUp: async (event) => {
      // Auto-confirm users
      event.response.autoConfirmUser = true;
      if (event.request.userAttributes.email) {
        event.response.autoVerifyEmail = true;
      }
      return event;
    },
  },
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    requireUppercase: true,
  },
});