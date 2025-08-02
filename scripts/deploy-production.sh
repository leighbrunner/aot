#!/bin/bash

# Production Deployment Script
# This script deploys the voting app to production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_PROFILE=${AWS_PROFILE:-leigh}
AWS_REGION=${AWS_REGION:-ap-southeast-2}
ENVIRONMENT="production"

echo -e "${YELLOW}Starting production deployment...${NC}"

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}AWS CLI not found. Please install it first.${NC}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile $AWS_PROFILE &>/dev/null; then
        echo -e "${RED}AWS credentials not configured for profile ${AWS_PROFILE}${NC}"
        exit 1
    fi
    
    # Check Amplify CLI
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}npx not found. Please install Node.js first.${NC}"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}.env.production file not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All prerequisites met${NC}"
}

# Function to run tests
run_tests() {
    echo -e "\n${YELLOW}Running tests...${NC}"
    
    # Run unit tests
    npm test -- --coverage
    
    # Run integration tests
    npm run test:integration
    
    # Check TypeScript
    npm run typecheck
    
    # Run linting
    npm run lint
    
    echo -e "${GREEN}All tests passed${NC}"
}

# Function to build the app
build_app() {
    echo -e "\n${YELLOW}Building production app...${NC}"
    
    # Clean previous builds
    rm -rf dist/ .expo/
    
    # Build for production
    NODE_ENV=production npm run build
    
    echo -e "${GREEN}Build completed${NC}"
}

# Function to deploy backend
deploy_backend() {
    echo -e "\n${YELLOW}Deploying backend to production...${NC}"
    
    # Set environment variables
    export AWS_BRANCH=main
    export AWS_PROFILE=$AWS_PROFILE
    
    # Deploy with Amplify
    npx ampx pipeline-deploy --branch main --app-id $AMPLIFY_APP_ID
    
    # Wait for deployment to complete
    echo "Waiting for deployment to complete..."
    npx ampx status --watch
    
    echo -e "${GREEN}Backend deployed successfully${NC}"
}

# Function to deploy web app
deploy_web() {
    echo -e "\n${YELLOW}Deploying web app...${NC}"
    
    # Build web version
    npx expo export:web
    
    # Deploy to S3/CloudFront or your hosting service
    aws s3 sync web-build/ s3://voting-app-production-web \
        --profile $AWS_PROFILE \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "*.json"
    
    # Upload HTML files with no cache
    aws s3 sync web-build/ s3://voting-app-production-web \
        --profile $AWS_PROFILE \
        --exclude "*" \
        --include "*.html" \
        --include "*.json" \
        --cache-control "public, max-age=0, must-revalidate"
    
    # Invalidate CloudFront cache
    DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --profile $AWS_PROFILE \
        --query "DistributionList.Items[?Comment=='Voting App Web Production'].Id" \
        --output text)
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation \
            --profile $AWS_PROFILE \
            --distribution-id $DISTRIBUTION_ID \
            --paths "/*"
        echo -e "${GREEN}CloudFront cache invalidated${NC}"
    fi
    
    echo -e "${GREEN}Web app deployed${NC}"
}

# Function to deploy mobile apps
deploy_mobile() {
    echo -e "\n${YELLOW}Building mobile apps for production...${NC}"
    
    # Update app version
    npm version patch
    
    # Build iOS
    eas build --platform ios --profile production --non-interactive
    
    # Build Android
    eas build --platform android --profile production --non-interactive
    
    # Submit to stores (manual approval required)
    echo -e "${YELLOW}Mobile builds queued. Check EAS dashboard for status.${NC}"
    echo "Once builds are complete, submit to stores:"
    echo "  iOS: eas submit --platform ios"
    echo "  Android: eas submit --platform android"
}

# Function to run smoke tests
run_smoke_tests() {
    echo -e "\n${YELLOW}Running smoke tests...${NC}"
    
    # Wait for services to be ready
    sleep 30
    
    # Run smoke tests
    npm run test:smoke:prod
    
    echo -e "${GREEN}Smoke tests passed${NC}"
}

# Function to update monitoring
update_monitoring() {
    echo -e "\n${YELLOW}Updating monitoring configuration...${NC}"
    
    # Update Sentry release
    npx sentry-cli releases new $VERSION
    npx sentry-cli releases set-commits $VERSION --auto
    npx sentry-cli releases finalize $VERSION
    
    # Deploy source maps to Sentry
    npx sentry-cli releases files $VERSION upload-sourcemaps ./dist
    
    echo -e "${GREEN}Monitoring updated${NC}"
}

# Function to notify team
notify_team() {
    echo -e "\n${YELLOW}Sending deployment notification...${NC}"
    
    # Send SNS notification
    aws sns publish \
        --profile $AWS_PROFILE \
        --topic-arn "arn:aws:sns:${AWS_REGION}:$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text):voting-app-deployments" \
        --subject "Production Deployment Complete" \
        --message "Version $VERSION has been deployed to production. 

Backend: Deployed
Web: Deployed
Mobile: Builds queued

Please verify the deployment and run manual tests."
    
    echo -e "${GREEN}Team notified${NC}"
}

# Main deployment flow
main() {
    echo -e "${YELLOW}=== PRODUCTION DEPLOYMENT ===${NC}"
    echo -e "${RED}WARNING: This will deploy to PRODUCTION environment${NC}"
    echo -e "Current branch: $(git branch --show-current)"
    echo -e "Last commit: $(git log -1 --oneline)"
    
    # Confirmation
    read -p "Are you sure you want to deploy to production? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
    
    # Get version
    VERSION=$(node -p "require('./package.json').version")
    echo -e "Deploying version: ${VERSION}"
    
    # Run deployment steps
    check_prerequisites
    run_tests
    build_app
    
    # Deploy backend first
    deploy_backend
    
    # Deploy frontend
    deploy_web
    deploy_mobile
    
    # Post-deployment
    run_smoke_tests
    update_monitoring
    notify_team
    
    echo -e "\n${GREEN}=== DEPLOYMENT COMPLETE ===${NC}"
    echo -e "Version ${VERSION} has been deployed to production"
    echo -e "\nNext steps:"
    echo -e "1. Monitor CloudWatch dashboards"
    echo -e "2. Check Sentry for any new errors"
    echo -e "3. Verify feature flags are configured correctly"
    echo -e "4. Submit mobile apps to stores when builds complete"
}

# Run main function
main "$@"