#!/bin/bash

# Emergency Backup Script
# Creates immediate backup of all critical data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE=${AWS_PROFILE:-leigh}
AWS_REGION=${AWS_REGION:-ap-southeast-2}
BACKUP_PREFIX="emergency-$(date +%Y%m%d-%H%M%S)"

echo -e "${RED}EMERGENCY BACKUP INITIATED${NC}"
echo "Timestamp: $(date)"
echo "Backup ID: $BACKUP_PREFIX"

# Function to backup DynamoDB tables
backup_dynamodb() {
    echo -e "\n${YELLOW}Backing up DynamoDB tables...${NC}"
    
    TABLES=(
        "VotingTable"
        "ImagesTable"
        "UsersTable"
        "AnalyticsTable"
        "CategoriesTable"
    )
    
    for table in "${TABLES[@]}"; do
        echo "Backing up $table..."
        
        # Create on-demand backup
        BACKUP_ARN=$(aws dynamodb create-backup \
            --table-name $table \
            --backup-name "${BACKUP_PREFIX}-${table}" \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --query 'BackupDetails.BackupArn' \
            --output text)
        
        if [ -n "$BACKUP_ARN" ]; then
            echo -e "${GREEN}✓ Backup created for $table${NC}"
            echo "  ARN: $BACKUP_ARN"
            
            # Also export to S3 for redundancy
            aws dynamodb export-table-to-point-in-time \
                --table-arn "arn:aws:dynamodb:${AWS_REGION}:$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text):table/${table}" \
                --s3-bucket "voting-app-emergency-backups" \
                --s3-prefix "${BACKUP_PREFIX}/${table}" \
                --profile $AWS_PROFILE \
                --region $AWS_REGION 2>/dev/null || true
        else
            echo -e "${RED}✗ Failed to backup $table${NC}"
        fi
    done
}

# Function to backup S3 buckets
backup_s3() {
    echo -e "\n${YELLOW}Backing up S3 buckets...${NC}"
    
    BUCKETS=(
        "voting-app-production-images"
        "voting-app-production-configs"
    )
    
    for bucket in "${BUCKETS[@]}"; do
        echo "Backing up $bucket..."
        
        # Sync to backup bucket
        aws s3 sync "s3://${bucket}" "s3://voting-app-emergency-backups/${BACKUP_PREFIX}/${bucket}" \
            --profile $AWS_PROFILE \
            --storage-class GLACIER_IR \
            --metadata "backup-date=$(date +%Y-%m-%d),backup-type=emergency"
        
        echo -e "${GREEN}✓ Backup completed for $bucket${NC}"
    done
}

# Function to backup Lambda functions
backup_lambdas() {
    echo -e "\n${YELLOW}Backing up Lambda functions...${NC}"
    
    FUNCTIONS=(
        "submitVote"
        "getImagePair"
        "getLeaderboard"
        "getUserStats"
        "adminApproveImage"
    )
    
    mkdir -p "/tmp/${BACKUP_PREFIX}/lambda"
    
    for func in "${FUNCTIONS[@]}"; do
        echo "Backing up $func..."
        
        # Get function configuration
        aws lambda get-function \
            --function-name $func \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            > "/tmp/${BACKUP_PREFIX}/lambda/${func}-config.json"
        
        # Download function code
        CODE_URL=$(aws lambda get-function \
            --function-name $func \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --query 'Code.Location' \
            --output text)
        
        curl -s "$CODE_URL" -o "/tmp/${BACKUP_PREFIX}/lambda/${func}-code.zip"
        
        echo -e "${GREEN}✓ Backup completed for $func${NC}"
    done
    
    # Upload to S3
    aws s3 cp "/tmp/${BACKUP_PREFIX}/lambda" \
        "s3://voting-app-emergency-backups/${BACKUP_PREFIX}/lambda" \
        --recursive \
        --profile $AWS_PROFILE
}

# Function to backup configurations
backup_configs() {
    echo -e "\n${YELLOW}Backing up configurations...${NC}"
    
    mkdir -p "/tmp/${BACKUP_PREFIX}/configs"
    
    # Backup Parameter Store
    aws ssm get-parameters-by-path \
        --path "/amplify/voting-app" \
        --recursive \
        --with-decryption \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        > "/tmp/${BACKUP_PREFIX}/configs/parameter-store.json"
    
    # Backup Secrets Manager
    aws secretsmanager list-secrets \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'SecretList[?contains(Name, `voting-app`)].Name' \
        --output text | while read secret; do
        
        aws secretsmanager get-secret-value \
            --secret-id "$secret" \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            > "/tmp/${BACKUP_PREFIX}/configs/secret-${secret}.json"
    done
    
    # Upload to S3
    aws s3 cp "/tmp/${BACKUP_PREFIX}/configs" \
        "s3://voting-app-emergency-backups/${BACKUP_PREFIX}/configs" \
        --recursive \
        --profile $AWS_PROFILE \
        --sse aws:kms
    
    echo -e "${GREEN}✓ Configuration backup completed${NC}"
}

# Function to create backup manifest
create_manifest() {
    echo -e "\n${YELLOW}Creating backup manifest...${NC}"
    
    cat > "/tmp/${BACKUP_PREFIX}/manifest.json" <<EOF
{
    "backupId": "${BACKUP_PREFIX}",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "region": "${AWS_REGION}",
    "type": "emergency",
    "components": {
        "dynamodb": true,
        "s3": true,
        "lambda": true,
        "configs": true
    },
    "status": "completed",
    "notes": "Emergency backup created by $(whoami)"
}
EOF
    
    # Upload manifest
    aws s3 cp "/tmp/${BACKUP_PREFIX}/manifest.json" \
        "s3://voting-app-emergency-backups/${BACKUP_PREFIX}/manifest.json" \
        --profile $AWS_PROFILE
    
    echo -e "${GREEN}✓ Manifest created${NC}"
}

# Function to notify team
notify_team() {
    echo -e "\n${YELLOW}Notifying team...${NC}"
    
    MESSAGE="Emergency backup completed
Backup ID: ${BACKUP_PREFIX}
Timestamp: $(date)
Components: DynamoDB, S3, Lambda, Configurations
Location: s3://voting-app-emergency-backups/${BACKUP_PREFIX}/

Please verify backup integrity and document reason for emergency backup."
    
    # Send SNS notification
    aws sns publish \
        --topic-arn "arn:aws:sns:${AWS_REGION}:$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text):voting-app-alerts-production" \
        --subject "Emergency Backup Completed" \
        --message "$MESSAGE" \
        --profile $AWS_PROFILE \
        --region $AWS_REGION 2>/dev/null || true
    
    echo -e "${GREEN}✓ Team notified${NC}"
}

# Main execution
main() {
    START_TIME=$(date +%s)
    
    # Confirm emergency backup
    echo -e "${RED}WARNING: This will create an emergency backup of all production data${NC}"
    read -p "Reason for emergency backup: " REASON
    
    if [ -z "$REASON" ]; then
        echo "Backup reason is required"
        exit 1
    fi
    
    echo "$REASON" > "/tmp/${BACKUP_PREFIX}/reason.txt"
    
    # Create backup bucket if it doesn't exist
    aws s3 mb "s3://voting-app-emergency-backups" \
        --profile $AWS_PROFILE \
        --region $AWS_REGION 2>/dev/null || true
    
    # Enable versioning on backup bucket
    aws s3api put-bucket-versioning \
        --bucket voting-app-emergency-backups \
        --versioning-configuration Status=Enabled \
        --profile $AWS_PROFILE 2>/dev/null || true
    
    # Run backups
    backup_dynamodb
    backup_s3
    backup_lambdas
    backup_configs
    create_manifest
    
    # Cleanup temp files
    rm -rf "/tmp/${BACKUP_PREFIX}"
    
    # Calculate duration
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo -e "\n${GREEN}=== EMERGENCY BACKUP COMPLETE ===${NC}"
    echo "Backup ID: ${BACKUP_PREFIX}"
    echo "Duration: ${DURATION} seconds"
    echo "Location: s3://voting-app-emergency-backups/${BACKUP_PREFIX}/"
    
    # Save backup info
    echo "${BACKUP_PREFIX}" > ~/.voting-app-last-emergency-backup
    
    notify_team
}

# Run main function
main "$@"