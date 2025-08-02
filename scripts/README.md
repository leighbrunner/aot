# Voting App Scripts

This directory contains automated scripts for setting up and managing the voting app.

## Quick Start

Run all setup tasks:
```bash
./run-all-setup.sh
```

## Individual Scripts

### 🚀 run-all-setup.sh
Master script that runs all setup tasks in sequence:
1. Configures backend resources
2. Tests backend connection
3. Checks social authentication
4. Installs dependencies
5. Runs tests
6. Verifies app configuration

### 🔧 configure-backend-resources.sh
Updates Lambda functions with backend resource IDs:
- Retrieves User Pool ID and API endpoint from CloudFormation
- Updates all Lambda function environment variables
- Falls back to amplify_outputs.json if needed

### 🔌 test-backend-connection.sh
Verifies backend is accessible:
- Checks amplify_outputs.json exists
- Tests API endpoint connectivity
- Verifies authentication configuration
- Confirms frontend dependencies

### 🔐 setup-social-auth.sh
Manages OAuth configuration:
- Checks if social auth secrets exist in Parameter Store
- Validates secret values (not placeholders)
- Provides instructions for adding real OAuth credentials

### 📱 start-app.sh
Launches the app on different platforms:
```bash
./start-app.sh ios     # iOS Simulator
./start-app.sh android # Android Emulator
./start-app.sh web     # Web Browser
```

## Adding OAuth Credentials

1. Create OAuth apps:
   - Google: https://console.cloud.google.com/apis/credentials
   - Facebook: https://developers.facebook.com/apps
   - Apple: https://developer.apple.com/account

2. Add secrets to AWS:
```bash
# Google
aws ssm put-parameter --name '/amplify/voting-app/GOOGLE_CLIENT_ID' --value 'YOUR_ID' --type 'SecureString' --overwrite --profile leigh
aws ssm put-parameter --name '/amplify/voting-app/GOOGLE_CLIENT_SECRET' --value 'YOUR_SECRET' --type 'SecureString' --overwrite --profile leigh

# Facebook
aws ssm put-parameter --name '/amplify/voting-app/FACEBOOK_CLIENT_ID' --value 'YOUR_ID' --type 'SecureString' --overwrite --profile leigh
aws ssm put-parameter --name '/amplify/voting-app/FACEBOOK_CLIENT_SECRET' --value 'YOUR_SECRET' --type 'SecureString' --overwrite --profile leigh

# Apple
aws ssm put-parameter --name '/amplify/voting-app/APPLE_CLIENT_ID' --value 'YOUR_ID' --type 'SecureString' --overwrite --profile leigh
aws ssm put-parameter --name '/amplify/voting-app/APPLE_KEY_ID' --value 'YOUR_KEY_ID' --type 'SecureString' --overwrite --profile leigh
aws ssm put-parameter --name '/amplify/voting-app/APPLE_PRIVATE_KEY' --value 'YOUR_KEY' --type 'SecureString' --overwrite --profile leigh
aws ssm put-parameter --name '/amplify/voting-app/APPLE_TEAM_ID' --value 'YOUR_TEAM_ID' --type 'SecureString' --overwrite --profile leigh
```

3. Enable social auth in `amplify/auth/resource.ts`

4. Redeploy:
```bash
AWS_PROFILE=leigh npx ampx sandbox
```

## Troubleshooting

### Script fails with "command not found"
```bash
chmod +x scripts/*.sh
```

### Backend resources not found
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name amplify-votingapp-leigh-sandbox-* --profile leigh

# Redeploy if needed
AWS_PROFILE=leigh npx ampx sandbox
```

### npm install fails
```bash
# Use legacy peer deps
npm install --legacy-peer-deps
```

### API returns 401 Unauthorized
This is expected for unauthenticated requests. The API is working correctly.