# Rollback Procedures

## Overview

This document outlines the rollback procedures for the Voting App in case of deployment failures or critical issues in production.

## Quick Rollback Commands

### 1. Backend Rollback (AWS Amplify)

```bash
# View deployment history
npx ampx pipeline-deploy --list

# Rollback to previous deployment
npx ampx pipeline-deploy --rollback --app-id <APP_ID> --branch main

# Rollback to specific deployment
npx ampx pipeline-deploy --rollback --deployment-id <DEPLOYMENT_ID>
```

### 2. Mobile App Rollback (EAS)

```bash
# List recent builds
eas build:list --platform all --limit 10

# Promote previous build to production
eas channel:edit production --branch <PREVIOUS_BUILD_ID>
```

### 3. Web Rollback (Vercel/Netlify)

```bash
# Vercel
vercel rollback <DEPLOYMENT_URL>

# Netlify
netlify rollback --site-id <SITE_ID>
```

## Detailed Procedures

### 1. Critical Production Issue

**Symptoms:**
- High error rate (>5%)
- App crashes on launch
- Core features not working
- Data corruption

**Steps:**
1. **Immediate Mitigation**
   ```bash
   # Disable problematic feature via feature flag
   node scripts/emergency-flag-disable.js <FEATURE_KEY>
   
   # Scale down if load-related
   aws lambda put-function-concurrency --function-name <FUNCTION> --reserved-concurrent-executions 0
   ```

2. **Assessment**
   - Check CloudWatch alarms
   - Review Sentry error reports
   - Check user feedback

3. **Rollback Decision**
   - If fix will take >30 minutes: ROLLBACK
   - If affecting >10% of users: ROLLBACK
   - If data integrity at risk: ROLLBACK

4. **Execute Rollback**
   ```bash
   # Backend
   npm run rollback:prod
   
   # Mobile (iOS)
   eas channel:edit production --branch <LAST_STABLE_IOS>
   
   # Mobile (Android)
   eas channel:edit production --branch <LAST_STABLE_ANDROID>
   ```

5. **Verify Rollback**
   - Check error rates return to normal
   - Test core functionality
   - Monitor for 15 minutes

### 2. Database Rollback

**WARNING:** Database rollbacks are complex and may result in data loss.

**Preparation:**
```bash
# Take snapshot before any deployment
aws dynamodb create-backup \
  --table-name VotingTable \
  --backup-name pre-deploy-$(date +%Y%m%d-%H%M%S)
```

**Rollback Steps:**
1. **Stop Write Traffic**
   ```bash
   # Disable write endpoints
   aws apigateway update-stage \
     --rest-api-id <API_ID> \
     --stage-name prod \
     --patch-operations op=replace,path=/*/throttle/rateLimit,value=0
   ```

2. **Restore from Backup**
   ```bash
   # List backups
   aws dynamodb list-backups --table-name VotingTable
   
   # Restore
   aws dynamodb restore-table-from-backup \
     --target-table-name VotingTable \
     --backup-arn <BACKUP_ARN>
   ```

3. **Verify Data Integrity**
   ```bash
   node scripts/verify-data-integrity.js
   ```

### 3. Lambda Function Rollback

**Individual Function:**
```bash
# List versions
aws lambda list-versions-by-function --function-name submitVote

# Update alias to previous version
aws lambda update-alias \
  --function-name submitVote \
  --name PROD \
  --function-version <PREVIOUS_VERSION>
```

**All Functions:**
```bash
# Use the rollback script
npm run rollback:lambdas
```

### 4. Frontend Rollback

**Web:**
1. Revert Git commit
   ```bash
   git revert <BAD_COMMIT>
   git push origin main
   ```

2. Trigger rebuild
   ```bash
   npm run deploy:web:prod
   ```

**Mobile:**
1. **Hot Fix** (JavaScript only)
   ```bash
   # Create hotfix
   eas update --branch hotfix --message "Rollback to stable"
   ```

2. **Native Rollback**
   ```bash
   # Promote previous build
   eas channel:edit production --branch <STABLE_BUILD>
   ```

### 5. Configuration Rollback

**Environment Variables:**
```bash
# Backup current config
aws ssm get-parameters-by-path --path /amplify/voting-app/prod > config-backup.json

# Restore previous config
aws ssm put-parameter --name <PARAM_NAME> --value <OLD_VALUE> --overwrite
```

**Feature Flags:**
```bash
# Emergency disable all experimental features
node scripts/disable-experimental-features.js

# Restore previous flag state
aws s3 cp s3://voting-app-config/feature-flags-backup.json .
node scripts/restore-feature-flags.js feature-flags-backup.json
```

## Automated Rollback

### CloudWatch Alarms

Automatic rollback triggers when:
- Error rate > 10% for 5 minutes
- P95 latency > 3 seconds
- Lambda errors > 100/minute

**Setup:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "HighErrorRate-AutoRollback" \
  --alarm-actions arn:aws:sns:region:account:rollback-topic \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

### Rollback Automation Script

```javascript
// scripts/auto-rollback.js
const AWS = require('aws-sdk');
const { exec } = require('child_process');

async function autoRollback(alarmName) {
  console.log(`Auto-rollback triggered by: ${alarmName}`);
  
  // 1. Disable traffic
  await disableTraffic();
  
  // 2. Rollback based on alarm type
  if (alarmName.includes('Lambda')) {
    await rollbackLambdas();
  } else if (alarmName.includes('API')) {
    await rollbackAPI();
  }
  
  // 3. Notify team
  await notifyTeam(alarmName);
}
```

## Rollback Verification

### Health Checks

```bash
# Run health check suite
npm run health-check:prod

# Manual verification
curl https://api.voting-app.com/health
```

### Smoke Tests

```bash
# Run critical path tests
npm run test:smoke:prod
```

### Monitoring

Monitor these metrics post-rollback:
- Error rate < 0.1%
- P95 latency < 500ms
- Success rate > 99.9%
- No new Sentry errors

## Post-Rollback

### 1. Incident Report

Create incident report with:
- Timeline of events
- Root cause
- Impact assessment
- Rollback decision rationale
- Lessons learned

### 2. Fix Forward

1. Create hotfix branch
   ```bash
   git checkout -b hotfix/issue-description
   ```

2. Fix issue with tests
   ```bash
   npm test
   npm run test:integration
   ```

3. Deploy to staging first
   ```bash
   npm run deploy:staging
   npm run test:smoke:staging
   ```

4. Deploy to production with monitoring
   ```bash
   npm run deploy:prod -- --canary
   ```

### 3. Update Procedures

- Update rollback scripts if needed
- Add new alarms for undetected issues
- Update runbooks

## Emergency Contacts

- **On-Call Engineer**: See PagerDuty
- **AWS Support**: 1-800-xxx-xxxx (Enterprise Support)
- **Team Lead**: [Contact in team docs]
- **DevOps**: [Contact in team docs]

## Rollback Scripts Location

All rollback scripts are in `/scripts/rollback/`:
- `rollback-backend.sh` - Backend services
- `rollback-frontend.sh` - Web frontend
- `rollback-mobile.sh` - Mobile apps
- `rollback-all.sh` - Complete rollback
- `verify-rollback.sh` - Verification script