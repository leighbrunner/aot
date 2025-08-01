import { defineStorage } from '@aws-amplify/backend';

/**
 * Define and configure your storage resource
 * @see https://docs.amplify.aws/react-native/build-a-backend/storage
 */
export const storage = defineStorage({
  name: 'votingAppImages',
  access: (allow) => ({
    'images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
    ],
    'pending/*': [
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'approved/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
    ],
    'rejected/*': [
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
  }),
});