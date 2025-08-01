import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions'
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'VotingAppAlerts', {
      displayName: 'Voting App Alerts',
    })

    // Add email subscription (replace with your email)
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription(process.env.ALERT_EMAIL || 'alerts@example.com')
    )

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'VotingAppDashboard', {
      dashboardName: 'VotingApp-Monitoring',
      defaultInterval: cdk.Duration.hours(1),
    })

    // API Gateway Metrics
    const apiErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiName: 'VotingApp',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    })

    const apiLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: 'VotingApp',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    })

    const apiRequestsMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiName: 'VotingApp',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    })

    // Lambda Metrics
    const lambdaErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: 'submitVote',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    })

    const lambdaDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      dimensionsMap: {
        FunctionName: 'submitVote',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    })

    const lambdaThrottlesMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Throttles',
      dimensionsMap: {
        FunctionName: 'submitVote',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    })

    // DynamoDB Metrics
    const dynamoThrottlesMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'UserErrors',
      dimensionsMap: {
        TableName: 'VotingApp-Votes',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    })

    const dynamoLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'SuccessfulRequestLatency',
      dimensionsMap: {
        TableName: 'VotingApp-Votes',
        Operation: 'PutItem',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    })

    // Custom Application Metrics
    const votesPerMinuteMetric = new cloudwatch.Metric({
      namespace: 'VotingApp',
      metricName: 'VotesPerMinute',
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    })

    const activeUsersMetric = new cloudwatch.Metric({
      namespace: 'VotingApp',
      metricName: 'ActiveUsers',
      statistic: 'Maximum',
      period: cdk.Duration.minutes(5),
    })

    // Create Alarms
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      metric: apiErrorsMetric,
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API 5xx errors exceed threshold',
    })
    apiErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic))

    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      metric: apiLatencyMetric,
      threshold: 1000, // 1 second
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API latency exceeds 1 second',
    })
    apiLatencyAlarm.addAlarmAction(new actions.SnsAction(alertTopic))

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      metric: lambdaErrorsMetric,
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function errors exceed threshold',
    })
    lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic))

    const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      metric: lambdaDurationMetric,
      threshold: 3000, // 3 seconds
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function duration exceeds 3 seconds',
    })
    lambdaDurationAlarm.addAlarmAction(new actions.SnsAction(alertTopic))

    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
      metric: dynamoThrottlesMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB throttling detected',
    })
    dynamoThrottleAlarm.addAlarmAction(new actions.SnsAction(alertTopic))

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [apiRequestsMetric],
        right: [apiLatencyMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [apiErrorsMetric],
        width: 12,
        height: 6,
      })
    )

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Performance',
        left: [lambdaDurationMetric],
        right: [lambdaErrorsMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Throttles',
        left: [lambdaThrottlesMetric],
        width: 12,
        height: 6,
      })
    )

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Performance',
        left: [dynamoLatencyMetric],
        right: [dynamoThrottlesMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Application Metrics',
        left: [votesPerMinuteMetric],
        right: [activeUsersMetric],
        width: 12,
        height: 6,
      })
    )

    // Add alarm status widget
    dashboard.addWidgets(
      new cloudwatch.AlarmStatusWidget({
        title: 'Alarm Status',
        alarms: [
          apiErrorAlarm,
          apiLatencyAlarm,
          lambdaErrorAlarm,
          lambdaDurationAlarm,
          dynamoThrottleAlarm,
        ],
        width: 24,
        height: 4,
      })
    )
  }
}

// Helper function to publish custom metrics from Lambda
export const publishMetric = async (
  namespace: string,
  metricName: string,
  value: number,
  unit: 'Count' | 'Seconds' | 'Milliseconds' = 'Count',
  dimensions?: Record<string, string>
) => {
  const { CloudWatchClient, PutMetricDataCommand } = await import('@aws-sdk/client-cloudwatch')
  const client = new CloudWatchClient({})

  const params = {
    Namespace: namespace,
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: dimensions
          ? Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
          : undefined,
      },
    ],
  }

  try {
    await client.send(new PutMetricDataCommand(params))
  } catch (error) {
    console.error('Error publishing metric:', error)
  }
}