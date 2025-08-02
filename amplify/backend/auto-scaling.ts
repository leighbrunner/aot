import { Duration } from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/**
 * Configure auto-scaling for production resources
 */
export function configureAutoScaling(
  lambdaFunctions: Record<string, lambda.Function>,
  tables: Record<string, dynamodb.Table>,
  environment: string
) {
  const isProd = environment === 'main';
  const isStaging = environment === 'staging';
  
  if (!isProd && !isStaging) {
    return; // No auto-scaling for development environments
  }

  // Lambda Reserved Concurrent Executions
  configureLambdaScaling(lambdaFunctions, isProd);
  
  // DynamoDB Auto-scaling
  configureDynamoDBScaling(tables, isProd);
}

/**
 * Configure Lambda function scaling
 */
function configureLambdaScaling(
  lambdaFunctions: Record<string, lambda.Function>,
  isProd: boolean
) {
  // Critical functions with reserved concurrency
  const criticalFunctions = ['submitVote', 'getImagePair'];
  
  Object.entries(lambdaFunctions).forEach(([name, func]) => {
    if (criticalFunctions.includes(name)) {
      // Reserve concurrent executions for critical functions
      func.addEnvironment(
        'RESERVED_CONCURRENT_EXECUTIONS',
        isProd ? '100' : '50'
      );
      
      // Configure provisioned concurrency for production
      if (isProd) {
        const alias = func.addAlias('live', {
          version: func.currentVersion,
          provisionedConcurrentExecutions: 10,
        });
        
        // Auto-scale provisioned concurrency
        const target = new applicationautoscaling.ScalableTarget(
          func,
          `${name}ScalableTarget`,
          {
            serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
            minCapacity: 10,
            maxCapacity: 100,
            resourceId: `function:${func.functionName}:live`,
            scalableDimension: 'lambda:function:ProvisionedConcurrency',
          }
        );
        
        // Scale based on utilization
        target.scaleToTrackMetric(`${name}Utilization`, {
          targetValue: 0.7,
          predefinedMetric: applicationautoscaling.PredefinedMetric
            .LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
        });
      }
    }
  });
}

/**
 * Configure DynamoDB table scaling
 */
function configureDynamoDBScaling(
  tables: Record<string, dynamodb.Table>,
  isProd: boolean
) {
  Object.entries(tables).forEach(([name, table]) => {
    // Skip if table is already using on-demand billing
    if (table.billingMode === dynamodb.BillingMode.PAY_PER_REQUEST) {
      return;
    }
    
    // Read capacity auto-scaling
    const readScaling = table.autoScaleReadCapacity({
      minCapacity: isProd ? 5 : 1,
      maxCapacity: isProd ? 1000 : 100,
    });
    
    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });
    
    // Write capacity auto-scaling
    const writeScaling = table.autoScaleWriteCapacity({
      minCapacity: isProd ? 5 : 1,
      maxCapacity: isProd ? 1000 : 100,
    });
    
    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });
    
    // Scale on throttles
    readScaling.scaleOnThrottle({
      scalingSteps: [
        { upper: 10, change: +10 },
        { upper: 50, change: +50 },
        { upper: 100, change: +100 },
      ],
    });
    
    writeScaling.scaleOnThrottle({
      scalingSteps: [
        { upper: 10, change: +10 },
        { upper: 50, change: +50 },
        { upper: 100, change: +100 },
      ],
    });
    
    // GSI auto-scaling
    if (table.globalSecondaryIndexes) {
      table.globalSecondaryIndexes.forEach((gsi) => {
        const gsiReadScaling = table.autoScaleGlobalSecondaryIndexReadCapacity(
          gsi.indexName,
          {
            minCapacity: isProd ? 5 : 1,
            maxCapacity: isProd ? 500 : 50,
          }
        );
        
        gsiReadScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
        });
        
        const gsiWriteScaling = table.autoScaleGlobalSecondaryIndexWriteCapacity(
          gsi.indexName,
          {
            minCapacity: isProd ? 5 : 1,
            maxCapacity: isProd ? 500 : 50,
          }
        );
        
        gsiWriteScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
        });
      });
    }
  });
}

/**
 * Configure CloudFront auto-invalidation
 */
export function configureCloudFrontAutoInvalidation(
  distribution: any,
  s3Bucket: any
) {
  // Create Lambda function to auto-invalidate on S3 changes
  const invalidationFunction = new lambda.Function(
    distribution,
    'AutoInvalidationFunction',
    {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const aws = require('aws-sdk');
        const cloudfront = new aws.CloudFront();
        
        exports.handler = async (event) => {
          const distributionId = process.env.DISTRIBUTION_ID;
          
          const paths = event.Records.map(record => {
            const key = record.s3.object.key;
            return '/' + key;
          });
          
          const params = {
            DistributionId: distributionId,
            InvalidationBatch: {
              CallerReference: Date.now().toString(),
              Paths: {
                Quantity: paths.length,
                Items: paths
              }
            }
          };
          
          try {
            await cloudfront.createInvalidation(params).promise();
            console.log('Invalidation created for paths:', paths);
          } catch (error) {
            console.error('Error creating invalidation:', error);
            throw error;
          }
        };
      `),
      environment: {
        DISTRIBUTION_ID: distribution.distributionId,
      },
      timeout: Duration.seconds(60),
    }
  );
  
  // Grant permissions
  invalidationFunction.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [`arn:aws:cloudfront::*:distribution/${distribution.distributionId}`],
    })
  );
  
  // Add S3 event notification
  s3Bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3n.LambdaDestination(invalidationFunction),
    { prefix: 'images/', suffix: '.jpg' }
  );
  
  s3Bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3n.LambdaDestination(invalidationFunction),
    { prefix: 'images/', suffix: '.png' }
  );
}

/**
 * Configure API Gateway throttling
 */
export function configureApiThrottling(api: any, isProd: boolean) {
  // Global throttling
  api.deploymentStage.throttlingRateLimit = isProd ? 10000 : 1000;
  api.deploymentStage.throttlingBurstLimit = isProd ? 5000 : 500;
  
  // Per-method throttling for critical endpoints
  const criticalEndpoints = [
    { path: '/vote', method: 'POST', rateLimit: 100, burstLimit: 200 },
    { path: '/images/pair', method: 'GET', rateLimit: 1000, burstLimit: 2000 },
  ];
  
  criticalEndpoints.forEach(({ path, method, rateLimit, burstLimit }) => {
    const methodResource = api.root.resourceForPath(path);
    const methodObject = methodResource.getMethod(method);
    
    if (methodObject) {
      methodObject.throttlingRateLimit = isProd ? rateLimit : rateLimit / 10;
      methodObject.throttlingBurstLimit = isProd ? burstLimit : burstLimit / 10;
    }
  });
}

/**
 * Configure ECS/Fargate auto-scaling for admin dashboard
 */
export function configureEcsAutoScaling(
  service: any,
  cluster: any,
  isProd: boolean
) {
  const scaling = service.autoScaleTaskCount({
    minCapacity: isProd ? 2 : 1,
    maxCapacity: isProd ? 10 : 3,
  });
  
  // Scale based on CPU utilization
  scaling.scaleOnCpuUtilization('CpuScaling', {
    targetUtilizationPercent: 70,
    scaleInCooldown: Duration.seconds(300),
    scaleOutCooldown: Duration.seconds(60),
  });
  
  // Scale based on memory utilization
  scaling.scaleOnMemoryUtilization('MemoryScaling', {
    targetUtilizationPercent: 80,
    scaleInCooldown: Duration.seconds(300),
    scaleOutCooldown: Duration.seconds(60),
  });
  
  // Scale based on request count
  scaling.scaleOnRequestCount('RequestCountScaling', {
    requestsPerTarget: 1000,
    targetGroup: service.targetGroup,
    scaleInCooldown: Duration.seconds(300),
    scaleOutCooldown: Duration.seconds(60),
  });
}