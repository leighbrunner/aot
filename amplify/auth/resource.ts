import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/react-native/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
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
    profilePicture: {
      mutable: true,
      required: false,
    },
    fullname: {
      mutable: true,
      required: false,
    },
  },
  groups: ['Admin', 'Moderator'],
});