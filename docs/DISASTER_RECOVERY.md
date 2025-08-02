# Disaster Recovery Plan - Voting App

## Overview

This document outlines the disaster recovery (DR) procedures for the Voting App. It covers various failure scenarios and the steps to recover from them.

## Recovery Objectives

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Maximum Tolerable Downtime (MTD)**: 24 hours

## Disaster Scenarios

### 1. Regional AWS Outage

**Impact**: Complete loss of service in primary region
**Likelihood**: Low
**Severity**: Critical

#### Recovery Steps:

1. **Immediate Actions** (0-15 minutes)
   ```bash
   # Verify regional outage
   aws health describe-events --region ap-southeast-2
   
   # Check AWS status page
   open https://status.aws.amazon.com/
   
   # Notify team
   ./scripts/notify-incident.sh "Regional outage detected"
   ```

2. **Failover to DR Region** (15-60 minutes)
   ```bash
   # Deploy to backup region (us-east-1)
   export AWS_REGION=us-east-1
   ./scripts/deploy-dr-region.sh
   
   # Update DNS to point to DR region
   ./scripts/update-route53-dr.sh
   
   # Verify services are running
   ./scripts/health-check-dr.sh
   ```

3. **Data Recovery** (1-2 hours)
   ```bash
   # Restore from cross-region backups
   ./scripts/restore-dynamodb-dr.sh
   
   # Sync S3 buckets
   aws s3 sync s3://voting-app-prod-images s3://voting-app-dr-images \
     --source-region ap-southeast-2 \
     --region us-east-1
   ```

### 2. DynamoDB Table Corruption

**Impact**: Data integrity issues, incorrect vote counts
**Likelihood**: Low
**Severity**: High

#### Recovery Steps:

1. **Identify Corruption** (0-30 minutes)
   ```bash
   # Run data integrity checks
   npm run scripts:verify-data-integrity
   
   # Export suspicious data
   aws dynamodb scan \
     --table-name VotingTable \
     --filter-expression "attribute_exists(corruption_flag)" \
     > corrupted_data.json
   ```

2. **Isolate and Stop Writes** (30-45 minutes)
   ```bash
   # Disable write endpoints
   ./scripts/disable-write-endpoints.sh
   
   # Create snapshot of current state
   ./scripts/create-emergency-backup.sh
   ```

3. **Restore from Backup** (1-3 hours)
   ```bash
   # List available backups
   aws dynamodb list-backups --table-name VotingTable
   
   # Restore to new table
   aws dynamodb restore-table-from-backup \
     --target-table-name VotingTable-restored \
     --backup-arn <BACKUP_ARN>
   
   # Verify restored data
   npm run scripts:verify-restored-data
   
   # Switch to restored table
   ./scripts/switch-to-restored-table.sh
   ```

### 3. Lambda Function Failure

**Impact**: API endpoints not responding
**Likelihood**: Medium
**Severity**: High

#### Recovery Steps:

1. **Immediate Rollback** (0-15 minutes)
   ```bash
   # Rollback all Lambda functions
   ./scripts/rollback/rollback-backend.sh
   
   # Verify functions are working
   ./scripts/test-lambda-functions.sh
   ```

2. **Root Cause Analysis** (15-60 minutes)
   ```bash
   # Check CloudWatch logs
   ./scripts/analyze-lambda-logs.sh
   
   # Review recent deployments
   git log --oneline -10
   aws lambda list-versions-by-function --function-name submitVote
   ```

### 4. Security Breach

**Impact**: Unauthorized access, data exposure
**Likelihood**: Low
**Severity**: Critical

#### Recovery Steps:

1. **Immediate Containment** (0-30 minutes)
   ```bash
   # Rotate all credentials
   ./scripts/emergency-credential-rotation.sh
   
   # Block suspicious IPs
   ./scripts/update-waf-rules.sh --emergency
   
   # Disable affected services
   ./scripts/emergency-shutdown.sh --partial
   ```

2. **Investigation** (30 minutes - 2 hours)
   ```bash
   # Analyze access logs
   ./scripts/security-audit.sh
   
   # Export suspicious activities
   aws cloudtrail lookup-events \
     --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
     --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole
   ```

3. **Recovery and Hardening** (2-4 hours)
   ```bash
   # Apply security patches
   ./scripts/apply-security-patches.sh
   
   # Update security groups
   ./scripts/harden-security-groups.sh
   
   # Enable additional monitoring
   ./scripts/enable-guardduty.sh
   ```

### 5. Complete Data Loss

**Impact**: All data lost, service unavailable
**Likelihood**: Very Low
**Severity**: Critical

#### Recovery Steps:

1. **Assessment** (0-1 hour)
   ```bash
   # Check all backup locations
   ./scripts/inventory-all-backups.sh
   
   # Verify S3 versioning
   aws s3api list-object-versions --bucket voting-app-backups
   ```

2. **Full Recovery** (2-8 hours)
   ```bash
   # Restore infrastructure
   ./scripts/rebuild-infrastructure.sh
   
   # Restore all data from backups
   ./scripts/full-data-restore.sh
   
   # Verify data integrity
   ./scripts/comprehensive-data-check.sh
   ```

## Backup Strategy

### Automated Backups

1. **DynamoDB**
   - Point-in-time recovery: Enabled
   - Daily backups: 3 AM UTC
   - Weekly backups: Sunday 3 AM UTC
   - Retention: 30 days (daily), 90 days (weekly)

2. **S3 Images**
   - Versioning: Enabled
   - Cross-region replication: ap-southeast-2 → us-east-1
   - Lifecycle: Move to Glacier after 90 days

3. **Lambda Functions**
   - Version history: All versions retained
   - Code backup: Git repository
   - Configuration backup: AWS Systems Manager

### Manual Backup Procedures

```bash
# Create manual backup before major changes
./scripts/create-manual-backup.sh --reason "Pre-deployment backup"

# Verify backup integrity
./scripts/verify-backup.sh --backup-id <BACKUP_ID>
```

## Communication Plan

### Incident Levels

1. **Level 1 (Low)**: Single component failure, auto-recovery in progress
   - Notify: On-call engineer
   - Channel: Slack #alerts

2. **Level 2 (Medium)**: Multiple components affected, manual intervention required
   - Notify: Engineering team
   - Channel: PagerDuty + Slack #incidents

3. **Level 3 (High)**: Service degradation, customer impact
   - Notify: Engineering team + Management
   - Channel: Phone tree + Status page update

4. **Level 4 (Critical)**: Complete outage or data loss
   - Notify: All stakeholders
   - Channel: All hands call + Public communication

### Contact List

```
On-Call Engineer: Use PagerDuty
Engineering Lead: +61 XXX XXX XXX
CTO: +61 XXX XXX XXX
AWS Support: 1-800-XXX-XXXX (Enterprise Support)
```

## Testing Procedures

### Monthly DR Drills

1. **Backup Restoration Test**
   ```bash
   # Run on first Monday of each month
   ./scripts/dr-drill-backup-restore.sh
   ```

2. **Failover Test**
   ```bash
   # Run on second Monday of each month
   ./scripts/dr-drill-failover.sh --dry-run
   ```

3. **Security Incident Simulation**
   ```bash
   # Run quarterly
   ./scripts/dr-drill-security-breach.sh
   ```

### Annual Full DR Test

- Schedule: First weekend of July
- Duration: 4 hours
- Scope: Complete failover to DR region
- Success criteria: Full service restoration within RTO

## Recovery Scripts

All recovery scripts are located in `/scripts/disaster-recovery/`:

- `create-emergency-backup.sh`: Creates immediate backup of all data
- `restore-dynamodb-dr.sh`: Restores DynamoDB tables from backup
- `failover-to-dr-region.sh`: Initiates failover to DR region
- `rollback-everything.sh`: Emergency rollback of all services
- `verify-recovery.sh`: Verifies successful recovery
- `generate-dr-report.sh`: Creates post-incident report

## Post-Incident Procedures

1. **Incident Report** (Within 24 hours)
   - Timeline of events
   - Root cause analysis
   - Impact assessment
   - Actions taken

2. **Lessons Learned** (Within 1 week)
   - What went well
   - What could be improved
   - Action items
   - DR plan updates

3. **Implementation** (Within 2 weeks)
   - Update runbooks
   - Improve automation
   - Schedule training
   - Update documentation

## Maintenance

- Review DR plan: Quarterly
- Update contact list: Monthly
- Test backup restoration: Monthly
- Update scripts: As needed
- Train new team members: During onboarding

## Appendix

### Quick Reference Commands

```bash
# Check system health
./scripts/health-check-all.sh

# View recent backups
./scripts/list-recent-backups.sh

# Test connectivity to DR region
./scripts/test-dr-connectivity.sh

# Generate DR readiness report
./scripts/dr-readiness-report.sh
```

### AWS Support

For enterprise support during incidents:
1. Log into AWS Console
2. Create support case with "Critical" severity
3. Call AWS Support hotline
4. Reference Enterprise Support agreement

### Third-Party Services

- **Sentry**: https://sentry.io/organizations/voting-app/
- **StatusPage**: https://status.votingapp.com/
- **PagerDuty**: https://votingapp.pagerduty.com/

---

Last Updated: August 2025
Next Review: November 2025