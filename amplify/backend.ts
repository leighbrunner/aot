import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { getImagePair } from './functions/getImagePair/resource';
import { submitVote } from './functions/submitVote/resource';
import { getLeaderboard } from './functions/getLeaderboard/resource';
import { getUserStats } from './functions/getUserStats/resource';
import { Stack } from 'aws-cdk-lib';
import { RestApi, LambdaIntegration, Cors } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Distribution, OriginAccessIdentity, ViewerProtocolPolicy, CachePolicy, AllowedMethods } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as events from 'aws-cdk-lib/aws-events';
import * as ssm from 'aws-cdk-lib/aws-ssm';

/**
 * @see https://docs.amplify.aws/react-native/build-a-backend/ to add more resources
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  getImagePair,
  submitVote,
  getLeaderboard,
  getUserStats,
});

// Get the underlying CDK stack
const dataStack = Stack.of(backend.data);

// Get table names and pass to Lambda functions
const imagesTableName = backend.data.resources.tables['Image'].tableName;
const votesTableName = backend.data.resources.tables['Vote'].tableName;
const usersTableName = backend.data.resources.tables['User'].tableName;
const analyticsTableName = backend.data.resources.tables['Analytics'].tableName;

// Update Lambda environment variables
backend.getImagePair.resources.lambda.addEnvironment('IMAGES_TABLE_NAME', imagesTableName);
backend.getImagePair.resources.lambda.addEnvironment('VOTES_TABLE_NAME', votesTableName);

backend.submitVote.resources.lambda.addEnvironment('VOTES_TABLE_NAME', votesTableName);
backend.submitVote.resources.lambda.addEnvironment('IMAGES_TABLE_NAME', imagesTableName);
backend.submitVote.resources.lambda.addEnvironment('USERS_TABLE_NAME', usersTableName);
backend.submitVote.resources.lambda.addEnvironment('ANALYTICS_TABLE_NAME', analyticsTableName);

backend.getLeaderboard.resources.lambda.addEnvironment('IMAGES_TABLE_NAME', imagesTableName);
backend.getLeaderboard.resources.lambda.addEnvironment('ANALYTICS_TABLE_NAME', analyticsTableName);

backend.getUserStats.resources.lambda.addEnvironment('VOTES_TABLE_NAME', votesTableName);
backend.getUserStats.resources.lambda.addEnvironment('USERS_TABLE_NAME', usersTableName);
backend.getUserStats.resources.lambda.addEnvironment('IMAGES_TABLE_NAME', imagesTableName);
backend.getUserStats.resources.lambda.addEnvironment('ANALYTICS_TABLE_NAME', analyticsTableName);

// Grant permissions to Lambda functions
backend.data.resources.tables['Image'].grantReadData(backend.getImagePair.resources.lambda);
backend.data.resources.tables['Vote'].grantReadData(backend.getImagePair.resources.lambda);

backend.data.resources.tables['Vote'].grantWriteData(backend.submitVote.resources.lambda);
backend.data.resources.tables['Image'].grantReadWriteData(backend.submitVote.resources.lambda);
backend.data.resources.tables['User'].grantReadWriteData(backend.submitVote.resources.lambda);
backend.data.resources.tables['Analytics'].grantReadWriteData(backend.submitVote.resources.lambda);

backend.data.resources.tables['Image'].grantReadData(backend.getLeaderboard.resources.lambda);
backend.data.resources.tables['Analytics'].grantReadData(backend.getLeaderboard.resources.lambda);

backend.data.resources.tables['Vote'].grantReadData(backend.getUserStats.resources.lambda);
backend.data.resources.tables['User'].grantReadData(backend.getUserStats.resources.lambda);
backend.data.resources.tables['Image'].grantReadData(backend.getUserStats.resources.lambda);
backend.data.resources.tables['Analytics'].grantReadData(backend.getUserStats.resources.lambda);

// Create REST API
const api = new RestApi(dataStack, 'VotingAPI', {
  restApiName: 'VotingAPI',
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Anonymous-Id'],
  },
});

// Create API resources
const imagesResource = api.root.addResource('images');
const pairResource = imagesResource.addResource('pair');
const voteResource = api.root.addResource('vote');
const leaderboardResource = api.root.addResource('leaderboard');
const userResource = api.root.addResource('user');
const statsResource = userResource.addResource('stats');

// Add Lambda integrations
const getImagePairIntegration = new LambdaIntegration(backend.getImagePair.resources.lambda);
const submitVoteIntegration = new LambdaIntegration(backend.submitVote.resources.lambda);
const getLeaderboardIntegration = new LambdaIntegration(backend.getLeaderboard.resources.lambda);
const getUserStatsIntegration = new LambdaIntegration(backend.getUserStats.resources.lambda);

// Add methods
pairResource.addMethod('GET', getImagePairIntegration);
voteResource.addMethod('POST', submitVoteIntegration);
leaderboardResource.addMethod('GET', getLeaderboardIntegration);
statsResource.addMethod('GET', getUserStatsIntegration);

// Add API Gateway permissions to Lambda functions
backend.getImagePair.resources.lambda.addPermission('ApiGatewayInvoke', {
  principal: new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    effect: Effect.ALLOW,
    principals: [api.arnForExecuteApi('GET', '/images/pair')],
  }).principal,
  sourceArn: api.arnForExecuteApi('GET', '/images/pair'),
});

backend.submitVote.resources.lambda.addPermission('ApiGatewayInvoke', {
  principal: new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    effect: Effect.ALLOW,
    principals: [api.arnForExecuteApi('POST', '/vote')],
  }).principal,
  sourceArn: api.arnForExecuteApi('POST', '/vote'),
});

backend.getUserStats.resources.lambda.addPermission('ApiGatewayInvoke', {
  principal: new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    effect: Effect.ALLOW,
    principals: [api.arnForExecuteApi('GET', '/user/stats')],
  }).principal,
  sourceArn: api.arnForExecuteApi('GET', '/user/stats'),
});

// Create Origin Access Identity for CloudFront
const oai = new OriginAccessIdentity(dataStack, 'ImageCDNOAI', {
  comment: 'OAI for Voting App Image CDN',
});

// Grant OAI permission to read from S3 bucket
backend.storage.resources.bucket.grantRead(oai);

// Create CloudFront distribution
const distribution = new Distribution(dataStack, 'ImageCDN', {
  comment: 'Voting App Image CDN',
  defaultBehavior: {
    origin: new S3Origin(backend.storage.resources.bucket, {
      originAccessIdentity: oai,
    }),
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    compress: true,
  },
  enableLogging: true,
  logBucket: backend.storage.resources.bucket,
  logFilePrefix: 'cloudfront-logs/',
});

// Add CloudFront URL to Lambda environment variables
backend.getImagePair.resources.lambda.addEnvironment('CLOUDFRONT_URL', distribution.distributionDomainName);

// Output the CloudFront URL
dataStack.addOutputs({
  CloudFrontURL: distribution.distributionDomainName,
  CloudFrontDistributionId: distribution.distributionId,
  ApiUrl: api.url,
});

// Environment configuration
const environment = process.env.AWS_BRANCH || 'sandbox';
const isProd = environment === 'main';
const isStaging = environment === 'staging';

// Production configuration
if (isProd || isStaging) {
  // Create SNS topic for alerts
  const alertTopic = new sns.Topic(dataStack, 'AlertTopic', {
    topicName: `voting-app-alerts-${environment}`,
    displayName: 'Voting App Alerts',
  });

  // Add email subscription for production alerts
  if (isProd) {
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('alerts@votingapp.com')
    );
  }

  // Create CloudWatch alarms for Lambda functions
  const lambdaFunctions = [
    { name: 'submitVote', function: backend.submitVote.resources.lambda },
    { name: 'getImagePair', function: backend.getImagePair.resources.lambda },
    { name: 'getLeaderboard', function: backend.getLeaderboard.resources.lambda },
    { name: 'getUserStats', function: backend.getUserStats.resources.lambda },
  ];

  lambdaFunctions.forEach(({ name, function: lambdaFn }) => {
    // Error rate alarm
    new cloudwatch.Alarm(dataStack, `${name}ErrorAlarm`, {
      metric: lambdaFn.metricErrors(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High error rate for ${name} function`,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Duration alarm
    new cloudwatch.Alarm(dataStack, `${name}DurationAlarm`, {
      metric: lambdaFn.metricDuration(),
      threshold: 3000, // 3 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High duration for ${name} function`,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Throttles alarm
    new cloudwatch.Alarm(dataStack, `${name}ThrottleAlarm`, {
      metric: lambdaFn.metricThrottles(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Throttling detected for ${name} function`,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
  });

  // Create DynamoDB alarms
  const tables = Object.values(backend.data.resources.tables);
  
  tables.forEach((table) => {
    // User errors alarm
    new cloudwatch.Alarm(dataStack, `${table.tableName}UserErrorsAlarm`, {
      metric: table.metricUserErrors(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High user errors for ${table.tableName}`,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // System errors alarm
    new cloudwatch.Alarm(dataStack, `${table.tableName}SystemErrorsAlarm`, {
      metric: table.metricSystemErrorsForOperations(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `System errors for ${table.tableName}`,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
  });

  // Create backup plan for DynamoDB tables
  const backupPlan = new backup.BackupPlan(dataStack, 'BackupPlan', {
    backupPlanName: `voting-app-backup-${environment}`,
    backupPlanRules: [
      new backup.BackupPlanRule({
        ruleName: 'DailyBackup',
        scheduleExpression: events.Schedule.cron({
          hour: '3',
          minute: '0',
        }),
        startWindow: backup.Duration.hours(1),
        completionWindow: backup.Duration.hours(2),
        deleteAfter: backup.Duration.days(isProd ? 30 : 7),
      }),
      ...(isProd ? [
        new backup.BackupPlanRule({
          ruleName: 'WeeklyBackup',
          scheduleExpression: events.Schedule.cron({
            weekDay: 'SUN',
            hour: '3',
            minute: '0',
          }),
          startWindow: backup.Duration.hours(1),
          completionWindow: backup.Duration.hours(2),
          deleteAfter: backup.Duration.days(90),
        }),
      ] : []),
    ],
  });

  // Add tables to backup plan
  tables.forEach((table) => {
    backupPlan.addSelection('TableBackup', {
      resources: [
        backup.BackupResource.fromDynamoDbTable(table),
      ],
    });
  });

  // Create CloudWatch dashboard
  const dashboard = new cloudwatch.Dashboard(dataStack, 'OperationalDashboard', {
    dashboardName: `voting-app-${environment}`,
  });

  // Add Lambda metrics to dashboard
  dashboard.addWidgets(
    new cloudwatch.GraphWidget({
      title: 'Lambda Function Errors',
      left: lambdaFunctions.map(({ name, function: fn }) => 
        fn.metricErrors({ label: name })
      ),
      width: 12,
    }),
    new cloudwatch.GraphWidget({
      title: 'Lambda Function Duration',
      left: lambdaFunctions.map(({ name, function: fn }) => 
        fn.metricDuration({ label: name })
      ),
      width: 12,
    })
  );

  // Add DynamoDB metrics to dashboard
  dashboard.addWidgets(
    new cloudwatch.GraphWidget({
      title: 'DynamoDB User Errors',
      left: tables.map((table) => 
        table.metricUserErrors({ label: table.tableName })
      ),
      width: 12,
    }),
    new cloudwatch.GraphWidget({
      title: 'DynamoDB Consumed Read Capacity',
      left: tables.map((table) => 
        table.metricConsumedReadCapacityUnits({ label: table.tableName })
      ),
      width: 12,
    })
  );

  // Set up cost alerts
  new cloudwatch.Alarm(dataStack, 'BillingAlarm', {
    metric: new cloudwatch.Metric({
      namespace: 'AWS/Billing',
      metricName: 'EstimatedCharges',
      dimensionsMap: {
        Currency: 'USD',
      },
      statistic: 'Maximum',
      period: cloudwatch.Duration.days(1),
    }),
    threshold: isProd ? 500 : 100, // $500 for prod, $100 for staging
    evaluationPeriods: 1,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    alarmDescription: 'Billing alarm for unexpected charges',
  }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
}