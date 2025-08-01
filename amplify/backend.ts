import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

/**
 * @see https://docs.amplify.aws/react-native/build-a-backend/ to add more resources
 */
const backend = defineBackend({
  auth,
  data,
  storage,
});