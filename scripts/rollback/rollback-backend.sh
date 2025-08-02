#!/bin/bash

# Backend Rollback Script
# Usage: ./rollback-backend.sh [deployment-id]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE=${AWS_PROFILE:-leigh}
AWS_REGION=${AWS_REGION:-ap-southeast-2}
APP_NAME="voting-app"
ENVIRONMENT=${ENVIRONMENT:-production}

echo -e "${YELLOW}Starting backend rollback for ${APP_NAME} (${ENVIRONMENT})...${NC}"

# Function to check AWS credentials
check_aws_credentials() {
    echo "Checking AWS credentials..."
    if ! aws sts get-caller-identity --profile $AWS_PROFILE &>/dev/null; then
        echo -e "${RED}Error: AWS credentials not configured for profile ${AWS_PROFILE}${NC}"
        exit 1
    fi
    echo -e "${GREEN}AWS credentials verified${NC}"
}

# Function to list recent deployments
list_deployments() {
    echo -e "\n${YELLOW}Recent deployments:${NC}"
    aws amplify list-backend-environments \
        --app-id $APP_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
}

# Function to get current deployment
get_current_deployment() {
    aws amplify get-branch \
        --app-id $APP_ID \
        --branch-name main \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'branch.activeJobId' \
        --output text
}

# Function to rollback Lambda functions
rollback_lambdas() {
    echo -e "\n${YELLOW}Rolling back Lambda functions...${NC}"
    
    FUNCTIONS=(
        "submitVote"
        "getImagePair"
        "getLeaderboard"
        "getUserStats"
        "adminApproveImage"
    )
    
    for func in "${FUNCTIONS[@]}"; do
        echo "Rolling back $func..."
        
        # Get current version
        CURRENT_VERSION=$(aws lambda get-alias \
            --function-name ${APP_NAME}-${ENVIRONMENT}-${func} \
            --name PROD \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --query 'FunctionVersion' \
            --output text)
        
        # Calculate previous version
        PREVIOUS_VERSION=$((CURRENT_VERSION - 1))
        
        if [ $PREVIOUS_VERSION -gt 0 ]; then
            # Update alias to previous version
            aws lambda update-alias \
                --function-name ${APP_NAME}-${ENVIRONMENT}-${func} \
                --name PROD \
                --function-version $PREVIOUS_VERSION \
                --profile $AWS_PROFILE \
                --region $AWS_REGION
            
            echo -e "${GREEN}✓ Rolled back $func from v$CURRENT_VERSION to v$PREVIOUS_VERSION${NC}"
        else
            echo -e "${YELLOW}⚠ Cannot rollback $func - no previous version${NC}"
        fi
    done
}

# Function to rollback API Gateway
rollback_api_gateway() {
    echo -e "\n${YELLOW}Rolling back API Gateway...${NC}"
    
    # Get API ID
    API_ID=$(aws apigatewayv2 get-apis \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query "Items[?Name=='${APP_NAME}-${ENVIRONMENT}'].ApiId" \
        --output text)
    
    if [ -z "$API_ID" ]; then
        echo -e "${RED}Error: API Gateway not found${NC}"
        return 1
    fi
    
    # Get current deployment
    CURRENT_DEPLOYMENT=$(aws apigatewayv2 get-stage \
        --api-id $API_ID \
        --stage-name prod \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'DeploymentId' \
        --output text)
    
    # Get previous deployment
    PREVIOUS_DEPLOYMENT=$(aws apigatewayv2 get-deployments \
        --api-id $API_ID \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query "Items[?DeploymentId!='$CURRENT_DEPLOYMENT'] | [0].DeploymentId" \
        --output text)
    
    if [ "$PREVIOUS_DEPLOYMENT" != "None" ] && [ -n "$PREVIOUS_DEPLOYMENT" ]; then
        # Update stage to previous deployment
        aws apigatewayv2 update-stage \
            --api-id $API_ID \
            --stage-name prod \
            --deployment-id $PREVIOUS_DEPLOYMENT \
            --profile $AWS_PROFILE \
            --region $AWS_REGION
        
        echo -e "${GREEN}✓ Rolled back API Gateway to deployment $PREVIOUS_DEPLOYMENT${NC}"
    else
        echo -e "${YELLOW}⚠ Cannot rollback API Gateway - no previous deployment${NC}"
    fi
}

# Function to rollback DynamoDB
rollback_dynamodb() {
    echo -e "\n${YELLOW}Checking DynamoDB backups...${NC}"
    
    TABLES=(
        "${APP_NAME}-${ENVIRONMENT}-Votes"
        "${APP_NAME}-${ENVIRONMENT}-Images"
        "${APP_NAME}-${ENVIRONMENT}-Users"
        "${APP_NAME}-${ENVIRONMENT}-Analytics"
    )
    
    for table in "${TABLES[@]}"; do
        # List recent backups
        LATEST_BACKUP=$(aws dynamodb list-backups \
            --table-name $table \
            --profile $AWS_PROFILE \
            --region $AWS_REGION \
            --query 'BackupSummaries[0].BackupArn' \
            --output text)
        
        if [ "$LATEST_BACKUP" != "None" ]; then
            echo -e "${GREEN}✓ Backup available for $table${NC}"
            echo "  ARN: $LATEST_BACKUP"
        else
            echo -e "${YELLOW}⚠ No backup found for $table${NC}"
        fi
    done
    
    echo -e "${YELLOW}Note: DynamoDB restore requires manual confirmation due to data implications${NC}"
    echo "To restore a table, run:"
    echo "aws dynamodb restore-table-from-backup --target-table-name <TABLE_NAME> --backup-arn <BACKUP_ARN>"
}

# Function to disable feature flags
disable_feature_flags() {
    echo -e "\n${YELLOW}Disabling experimental feature flags...${NC}"
    
    FLAGS_TO_DISABLE=(
        "new_voting_ui"
        "ai_recommendations"
        "image_filters"
    )
    
    for flag in "${FLAGS_TO_DISABLE[@]}"; do
        aws ssm put-parameter \
            --name "/amplify/${APP_NAME}/${ENVIRONMENT}/feature_flags/${flag}" \
            --value "false" \
            --type String \
            --overwrite \
            --profile $AWS_PROFILE \
            --region $AWS_REGION 2>/dev/null || true
        
        echo -e "${GREEN}✓ Disabled feature flag: $flag${NC}"
    done
}

# Function to verify rollback
verify_rollback() {
    echo -e "\n${YELLOW}Verifying rollback...${NC}"
    
    # Check health endpoint
    HEALTH_URL="https://api.${APP_NAME}.com/health"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
    
    if [ "$HTTP_STATUS" == "200" ]; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${RED}✗ Health check failed (HTTP $HTTP_STATUS)${NC}"
        return 1
    fi
    
    # Check error rates in CloudWatch
    echo "Checking CloudWatch metrics..."
    ERROR_COUNT=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/Lambda \
        --metric-name Errors \
        --dimensions Name=FunctionName,Value=${APP_NAME}-${ENVIRONMENT}-submitVote \
        --statistics Sum \
        --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query 'Datapoints[0].Sum' \
        --output text)
    
    if [ "$ERROR_COUNT" == "None" ] || [ "$ERROR_COUNT" == "0" ]; then
        echo -e "${GREEN}✓ No Lambda errors in last 5 minutes${NC}"
    else
        echo -e "${YELLOW}⚠ Lambda errors detected: $ERROR_COUNT${NC}"
    fi
}

# Main execution
main() {
    check_aws_credentials
    
    # Get App ID
    APP_ID=$(aws amplify list-apps \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --query "apps[?name=='${APP_NAME}'].appId" \
        --output text)
    
    if [ -z "$APP_ID" ]; then
        echo -e "${RED}Error: Amplify app not found${NC}"
        exit 1
    fi
    
    echo "App ID: $APP_ID"
    
    # Show current deployment
    CURRENT_DEPLOYMENT=$(get_current_deployment)
    echo "Current deployment: $CURRENT_DEPLOYMENT"
    
    # Confirm rollback
    echo -e "\n${YELLOW}This will rollback the following components:${NC}"
    echo "- Lambda functions (to previous version)"
    echo "- API Gateway (to previous deployment)"
    echo "- Feature flags (disable experimental features)"
    echo -e "\n${RED}Are you sure you want to proceed? (yes/no)${NC}"
    read -r confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo "Rollback cancelled"
        exit 0
    fi
    
    # Perform rollback
    rollback_lambdas
    rollback_api_gateway
    disable_feature_flags
    rollback_dynamodb
    
    # Verify
    echo -e "\n${YELLOW}Waiting 30 seconds for changes to propagate...${NC}"
    sleep 30
    
    verify_rollback
    
    echo -e "\n${GREEN}Backend rollback completed!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Monitor CloudWatch dashboards"
    echo "2. Check Sentry for new errors"
    echo "3. Run smoke tests: npm run test:smoke:prod"
    echo "4. Create incident report"
}

# Run main function
main "$@"