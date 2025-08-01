import { defineStorage } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Define and configure your storage resource
 * @see https://docs.amplify.aws/react-native/build-a-backend/storage
 */
export const storage = defineStorage({
  name: 'votingAppImages',
  access: (allow) => ({
    'images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'pending/*': [
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'approved/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'rejected/*': [
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
    'thumbnails/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
  }),
});

export const createStorageResources = (stack: Stack, bucket: s3.Bucket) => {
  // Configure bucket for image storage
  bucket.addLifecycleRule({
    id: 'MoveToIA',
    transitions: [{
      storageClass: s3.StorageClass.INFREQUENT_ACCESS,
      transitionAfter: 30,
    }],
  });
  
  // Create Origin Access Identity for CloudFront
  const oai = new cloudfront.OriginAccessIdentity(stack, 'ImageOAI', {
    comment: 'OAI for voting app images',
  });
  
  // Grant CloudFront OAI read access to bucket
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [bucket.arnForObjects('*')],
    principals: [oai.grantPrincipal],
  }));
  
  // Create CloudFront distribution
  const distribution = new cloudfront.Distribution(stack, 'ImageCDN', {
    defaultBehavior: {
      origin: new origins.S3Origin(bucket, {
        originAccessIdentity: oai,
      }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
    },
    priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    comment: 'CDN for voting app images',
  });
  
  return { distribution, oai };
};