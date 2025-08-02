# Automated Setup Guide

This guide provides automated scripts to complete all remaining setup tasks without manual intervention.

## Prerequisites

- AWS CLI configured with profile "leigh"
- Node.js 18+ installed
- Amplify Gen 2 backend deployed (sandbox)

## Automated Setup Scripts

### 1. Complete Backend Configuration

```bash
# Run all setup scripts in sequence
./scripts/run-all-setup.sh
```

This master script will:
1. Configure Lambda functions with backend resources
2. Test backend connectivity
3. Set up placeholder social authentication
4. Run initial tests

### 2. Individual Scripts

#### Configure Backend Resources
```bash
./scripts/configure-backend-resources.sh
```
- Updates all Lambda functions with environment variables
- Sets up proper IAM permissions
- Configures API Gateway integrations

#### Test Backend Connection
```bash
./scripts/test-backend-connection.sh
```
- Verifies amplify_outputs.json exists
- Tests API endpoint connectivity
- Checks authentication configuration
- Validates frontend dependencies

#### Setup Social Authentication
```bash
./scripts/setup-social-auth.sh
```
- Checks for OAuth credentials in Parameter Store
- Validates secret configuration
- Provides instructions for enabling social auth

### 3. Automated Testing

```bash
# Run all automated tests
npm run test:all

# Individual test suites
npm run test:unit      # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:api       # API integration tests
```

### 4. Automated Deployment

```bash
# Deploy to production (requires app ID)
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID

# Deploy mobile apps
eas build --platform all --profile production --non-interactive
eas submit --platform all --latest --non-interactive
```

## Master Setup Script

Create `scripts/run-all-setup.sh`:

```bash
#!/bin/bash

echo "🚀 Starting automated setup..."

# Ensure AWS profile is set
export AWS_PROFILE=leigh

# Step 1: Configure backend resources
echo "📋 Step 1: Configuring backend resources..."
./scripts/configure-backend-resources.sh
if [ $? -ne 0 ]; then
    echo "❌ Backend configuration failed"
    exit 1
fi

# Step 2: Test backend connection
echo "🔌 Step 2: Testing backend connection..."
./scripts/test-backend-connection.sh
if [ $? -ne 0 ]; then
    echo "❌ Backend connection test failed"
    exit 1
fi

# Step 3: Check social auth setup
echo "🔐 Step 3: Checking social authentication..."
./scripts/setup-social-auth.sh

# Step 4: Install dependencies
echo "📦 Step 4: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi

# Step 5: Run tests
echo "🧪 Step 5: Running tests..."
npm run test:unit
if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but continuing..."
fi

# Step 6: Build app
echo "🏗️  Step 6: Building app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Automated setup complete!"
echo ""
echo "Next steps:"
echo "1. Add real OAuth credentials if using social auth"
echo "2. Run the app: npm run ios/android/web"
echo "3. Deploy to production when ready"
```

## Environment-Specific Configuration

### Development
```bash
# Use sandbox
npx ampx sandbox --profile leigh
```

### Staging
```bash
# Deploy to staging branch
npx ampx pipeline-deploy --branch staging --app-id YOUR_APP_ID
```

### Production
```bash
# Deploy to production branch
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

## Automated Monitoring Setup

```bash
# Deploy CloudWatch dashboards
aws cloudformation deploy \
  --template-file infrastructure/monitoring.yml \
  --stack-name voting-app-monitoring \
  --profile leigh

# Set up alerts
aws cloudwatch put-metric-alarm \
  --alarm-name "VotingApp-API-Errors" \
  --alarm-description "Alert when API errors exceed 1%" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Average \
  --period 300 \
  --threshold 0.01 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --profile leigh
```

## Automated Backup Setup

```bash
# Enable DynamoDB backups
aws dynamodb update-continuous-backups \
  --table-name VotingApp-Votes \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --profile leigh

# Set up S3 lifecycle rules
aws s3api put-bucket-lifecycle-configuration \
  --bucket voting-app-images \
  --lifecycle-configuration file://infrastructure/s3-lifecycle.json \
  --profile leigh
```

## Troubleshooting Automation

If any script fails:

1. Check AWS credentials: `aws sts get-caller-identity --profile leigh`
2. Verify stack status: `aws cloudformation describe-stacks --stack-name amplify-votingapp-leigh-sandbox-*`
3. Check logs: `aws logs tail /aws/lambda/YOUR_FUNCTION --follow`
4. Run individual scripts to isolate issues

## CI/CD Automation

GitHub Actions workflow is configured to:
- Run tests on every push
- Deploy to sandbox on develop branch
- Deploy to production on main branch
- Send Slack notifications

To enable:
1. Add required secrets to GitHub repository
2. Enable GitHub Actions
3. Push to trigger workflow