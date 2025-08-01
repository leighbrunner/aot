# Voting App Deployment Guide

## Prerequisites

- AWS CLI installed and configured with profile "leigh"
- Node.js 18+ and npm installed
- Expo CLI and EAS CLI installed globally
- GitHub repository with Actions enabled
- Apple Developer account (for iOS deployment)
- Google Play Console account (for Android deployment)

## Environment Setup

### 1. AWS Profile Configuration

Always use the AWS profile "leigh" for all operations:

```bash
export AWS_PROFILE=leigh
aws sts get-caller-identity --profile leigh
```

### 2. Required Environment Variables

Create `.env.test` and `.env.production` files:

```bash
# .env.test
API_ENDPOINT=https://api-test.assortits.com
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
S3_BUCKET=assortits-test-images
CLOUDFRONT_URL=https://d1xxxxx.cloudfront.net

# .env.production
API_ENDPOINT=https://api.assortits.com
COGNITO_USER_POOL_ID=us-east-1_yyyyy
COGNITO_CLIENT_ID=yyyyy
S3_BUCKET=assortits-prod-images
CLOUDFRONT_URL=https://d2xxxxx.cloudfront.net
```

## Backend Deployment

### 1. Initialize Amplify

```bash
# First time setup
amplify init --profile leigh

# Select options:
# - Environment: test (for testing) or prod (for production)
# - Default editor: Visual Studio Code
# - Authentication method: AWS profile
# - Profile: leigh
```

### 2. Deploy Backend Infrastructure

```bash
# Deploy to test environment
amplify env checkout test --profile leigh
amplify push --yes --profile leigh

# Deploy to production
amplify env checkout prod --profile leigh
amplify push --yes --profile leigh
```

### 3. Deploy Additional Infrastructure

```bash
cd infrastructure
npm install

# Deploy WAF rules
cdk deploy VotingApp-WAF-test --profile leigh
cdk deploy VotingApp-WAF-prod --profile leigh

# Deploy monitoring stack
cdk deploy VotingApp-Monitoring-test --profile leigh
cdk deploy VotingApp-Monitoring-prod --profile leigh
```

## Admin Dashboard Deployment

### 1. Build Admin Dashboard

```bash
cd admin
npm install
npm run build
```

### 2. Deploy to S3 and CloudFront

```bash
# Test environment
aws s3 sync out/ s3://admin-test.assortits.com --delete --profile leigh
aws cloudfront create-invalidation \
  --distribution-id E1XXXXX \
  --paths "/*" \
  --profile leigh

# Production environment
aws s3 sync out/ s3://admin.assortits.com --delete --profile leigh
aws cloudfront create-invalidation \
  --distribution-id E2XXXXX \
  --paths "/*" \
  --profile leigh
```

## Mobile App Deployment

### 1. Configure EAS

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure
```

### 2. Build for App Stores

```bash
# iOS build
eas build --platform ios --profile production

# Android build
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 3. Over-the-Air Updates

```bash
# Publish OTA update
expo publish --release-channel production
```

## CI/CD Pipeline

### 1. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`: AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for deployment
- `EXPO_TOKEN`: Expo access token for EAS
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `PROD_API_ENDPOINT`: Production API endpoint
- `PROD_COGNITO_USER_POOL_ID`: Production Cognito pool ID
- `PROD_COGNITO_CLIENT_ID`: Production Cognito client ID
- `PROD_S3_BUCKET`: Production S3 bucket name
- `PROD_CLOUDFRONT_URL`: Production CloudFront URL
- `TEST_API_ENDPOINT`: Test API endpoint
- `TEST_COGNITO_USER_POOL_ID`: Test Cognito pool ID
- `TEST_COGNITO_CLIENT_ID`: Test Cognito client ID

### 2. Deployment Workflow

The GitHub Actions workflow automatically:

1. Runs tests on all pull requests
2. Deploys to test environment on pushes to `develop`
3. Deploys to production on pushes to `main`
4. Sends Slack notifications for deployment status

## Monitoring and Alerts

### 1. CloudWatch Dashboard

Access the dashboard at: https://console.aws.amazon.com/cloudwatch/

Key metrics to monitor:
- API request rates and latency
- Lambda function errors and duration
- DynamoDB throttles and capacity
- S3 request metrics
- CloudFront cache hit rates

### 2. Alert Configuration

Alerts are configured for:
- API 5xx errors > 1% (1 min)
- Lambda errors > 1% (5 min)
- DynamoDB throttles > 0 (1 min)
- Image generation failures > 2 (5 min)

### 3. Log Analysis

```bash
# View Lambda logs
aws logs tail /aws/lambda/submitVote --follow --profile leigh

# View API Gateway logs
aws logs tail /aws/api-gateway/VotingApp --follow --profile leigh
```

## Rollback Procedures

### 1. Backend Rollback

```bash
# List previous deployments
amplify env list --profile leigh

# Rollback to previous version
amplify env checkout <previous-env> --profile leigh
amplify push --yes --profile leigh
```

### 2. Mobile App Rollback

```bash
# Publish previous version via OTA
expo publish --release-channel production --clear
```

### 3. Admin Dashboard Rollback

Keep previous builds in S3 versioning or use git tags:

```bash
# Checkout previous version
git checkout v1.2.3
cd admin
npm install
npm run build
# Deploy as normal
```

## Troubleshooting

### Common Issues

1. **Amplify deployment fails**
   - Ensure AWS profile is set: `export AWS_PROFILE=leigh`
   - Check AWS credentials: `aws sts get-caller-identity --profile leigh`
   - Clear Amplify cache: `amplify env remove <env> --profile leigh`

2. **Mobile build fails**
   - Clear EAS cache: `eas build --clear-cache`
   - Check certificates: `eas credentials`
   - Verify app.json configuration

3. **CloudFront not updating**
   - Create invalidation: `aws cloudfront create-invalidation`
   - Check origin settings in CloudFront console
   - Verify S3 bucket policy

### Debug Commands

```bash
# Check Amplify status
amplify status --profile leigh

# View CloudFormation stacks
aws cloudformation list-stacks --profile leigh

# Check DynamoDB tables
aws dynamodb list-tables --profile leigh

# View Lambda functions
aws lambda list-functions --profile leigh
```

## Security Checklist

Before each deployment:

- [ ] Verify all environment variables are set correctly
- [ ] Check AWS WAF rules are active
- [ ] Confirm SSL certificates are valid
- [ ] Review API rate limits
- [ ] Test authentication flows
- [ ] Verify CORS settings
- [ ] Check security headers
- [ ] Review IAM permissions

## Performance Optimization

1. **Enable CloudFront compression**
2. **Configure Lambda reserved concurrency**
3. **Set up DynamoDB auto-scaling**
4. **Enable API Gateway caching**
5. **Optimize image sizes and formats**
6. **Configure CDN cache headers**

## Cost Monitoring

Monitor AWS costs:

```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --profile leigh
```

Set up billing alerts in AWS Budgets to track spending.