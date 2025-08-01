import { defineBackend } from '@aws-amplify/backend';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export const createApiResources = (backend: ReturnType<typeof defineBackend>) => {
  const stack = backend.createStack('api-stack');
  
  // Create REST API for voting endpoints
  const api = new apigateway.RestApi(stack, 'VotingApi', {
    restApiName: 'VotingAPI',
    deployOptions: {
      stageName: 'prod',
      throttlingBurstLimit: 1000,
      throttlingRateLimit: 100,
    },
    defaultCorsPreflightOptions: {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: apigateway.Cors.ALL_METHODS,
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
      ],
    },
  });

  // Voting endpoints
  const vote = api.root.addResource('vote');
  const images = api.root.addResource('images');
  const imagePair = images.addResource('pair');
  const user = api.root.addResource('user');
  const userStats = user.addResource('stats');
  const userHistory = user.addResource('history');
  
  // Leaderboards endpoints
  const leaderboards = api.root.addResource('leaderboards');
  const leaderboardPeriod = leaderboards.addResource('{period}');
  
  // Analytics endpoints
  const analytics = api.root.addResource('analytics');
  const analyticsCountries = analytics.addResource('countries');
  const analyticsCategories = analytics.addResource('categories');
  
  // Admin endpoints
  const admin = api.root.addResource('admin');
  const adminImages = admin.addResource('images');
  const adminImagesPending = adminImages.addResource('pending');
  const adminImagesGenerate = adminImages.addResource('generate');
  const adminImageId = adminImages.addResource('{id}');
  const adminImageApprove = adminImageId.addResource('approve');
  const adminImageReject = adminImageId.addResource('reject');
  const adminImagePromote = adminImageId.addResource('promote');
  
  const adminCategories = admin.addResource('categories');
  const adminCategoryId = adminCategories.addResource('{id}');
  
  const adminAnalytics = admin.addResource('analytics');
  const adminAnalyticsOverview = adminAnalytics.addResource('overview');
  const adminAnalyticsUsers = adminAnalytics.addResource('users');
  const adminAnalyticsContent = adminAnalytics.addResource('content');
  
  // Export API URL
  backend.addOutput({
    custom: {
      apiUrl: api.url,
    },
  });
  
  return { api, endpoints: {
    vote,
    imagePair,
    userStats,
    userHistory,
    leaderboardPeriod,
    analyticsCountries,
    analyticsCategories,
    adminImagesPending,
    adminImagesGenerate,
    adminImageApprove,
    adminImageReject,
    adminImagePromote,
    adminCategories,
    adminCategoryId,
    adminAnalyticsOverview,
    adminAnalyticsUsers,
    adminAnalyticsContent,
  }};
};