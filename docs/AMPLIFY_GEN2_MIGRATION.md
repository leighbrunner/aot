# Amplify Gen 2 Migration Guide

## Overview

This document describes the migration from Amplify CLI to Amplify Gen 2 for the voting app.

## Migration Date
- **Date**: November 2024
- **AWS Profile**: leigh
- **Region**: ap-southeast-2

## Key Changes

### 1. Project Structure
```
amplify/
├── backend.ts          # Main backend configuration
├── auth/
│   └── resource.ts     # Authentication configuration
├── data/
│   └── resource.ts     # Data models and API
├── storage/
│   └── resource.ts     # S3 storage configuration
├── functions/          # Lambda functions
├── package.json        # Backend dependencies
└── tsconfig.json       # TypeScript configuration
```

### 2. Commands
- Old: `amplify init`, `amplify push`
- New: `npx ampx sandbox`, `npx ampx generate`

### 3. Configuration
- Old: `aws-exports.js`
- New: `amplify_outputs.json`

## Current Status

### ✅ Completed
1. **Backend Infrastructure**
   - DynamoDB tables with relationships
   - AppSync GraphQL API
   - S3 storage with CloudFront
   - Cognito authentication (email only)
   - Lambda function structure

2. **Data Models**
   - Image model with voting relationships
   - Vote model with user tracking
   - User model with preferences
   - Analytics model for aggregations
   - Category model for content organization
   - Session model for tracking

3. **Deployment**
   - Sandbox environment deployed
   - Using AWS profile "leigh"
   - Region: ap-southeast-2

### ⏳ Pending
1. **Social Authentication**
   - Google OAuth integration
   - Facebook OAuth integration
   - Apple Sign In integration
   - Requires actual OAuth credentials

2. **Lambda Functions**
   - Environment variable configuration
   - Business logic implementation
   - Testing and validation

3. **Frontend Integration**
   - Update authentication flows
   - Connect to new GraphQL API
   - Test on all platforms

## Deployed Resources

### Authentication
- **User Pool ID**: ap-southeast-2_wx6stbe2Z
- **Identity Pool ID**: ap-southeast-2:dbf72613-dd37-486c-b2f5-3252ead6f76e
- **Client ID**: o5hcki6oqemku6pcql44ob53t

### API
- **GraphQL Endpoint**: https://ow4fzjgjfzbwpniusojhmgwpwi.appsync-api.ap-southeast-2.amazonaws.com/graphql
- **API Key**: da2-vmd444yxr5dfhb7omb7obbcsei

### Storage
- **Bucket**: Managed by Amplify
- **Access Levels**: 
  - Guest: Read access to approved images
  - Authenticated: Read access to all public content
  - Admin: Full access

## Scripts

### Configure Backend Resources
```bash
./scripts/configure-backend-resources.sh
```
Updates Lambda functions with backend resource IDs.

### Setup Social Authentication
```bash
./scripts/setup-social-auth.sh
```
Checks and configures social authentication secrets.

### Test Backend Connection
```bash
./scripts/test-backend-connection.sh
```
Verifies backend is accessible and app is configured correctly.

## Next Steps

1. **Enable Social Authentication**
   ```bash
   # Add real OAuth credentials
   aws ssm put-parameter --name '/amplify/voting-app/GOOGLE_CLIENT_ID' --value 'real-client-id' --type 'SecureString' --overwrite --profile leigh
   
   # Re-enable in amplify/auth/resource.ts
   # Run: npx ampx sandbox --profile leigh
   ```

2. **Implement Lambda Business Logic**
   - Update handler functions in `amplify/functions/*/handler.ts`
   - Use provided environment variables for AWS resources

3. **Test Frontend Integration**
   ```bash
   npm run ios     # iOS
   npm run android # Android  
   npm run web     # Web
   ```

4. **Deploy to Production**
   ```bash
   # Create production branch
   git checkout -b production
   
   # Deploy production environment
   npx ampx pipeline-deploy --branch production --app-id YOUR_APP_ID
   ```

## Troubleshooting

### Secret Errors
If you see "Failed to retrieve backend secret", ensure secrets exist:
```bash
aws ssm get-parameter --name "/amplify/voting-app/SECRET_NAME" --profile leigh
```

### Stack Already Exists
Delete the stack and retry:
```bash
aws cloudformation delete-stack --stack-name amplify-votingapp-leigh-sandbox-XXXXXX --profile leigh
```

### TypeScript Errors
- Enums don't support `.required()` in Amplify Gen 2
- Use proper relationship definitions (hasMany/belongsTo must be bidirectional)
- Check secondary index sort keys exist in model