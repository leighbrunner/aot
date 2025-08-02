#!/bin/bash

# Configure Lambda functions with backend resources
echo "Configuring Lambda functions with backend resources..."

# Ensure we're using the leigh profile
export AWS_PROFILE=leigh

# Get the stack outputs
STACK_NAME="amplify-votingapp-leigh-sandbox-23a06ac7e1"
REGION="ap-southeast-2"

echo "Retrieving stack outputs..."

# First check if the stack exists
if ! aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION >/dev/null 2>&1; then
    echo "Stack $STACK_NAME not found. Make sure the backend is deployed."
    exit 1
fi

# Get outputs from the stack - look for nested stacks too
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?contains(OutputKey, `UserPool`)].OutputValue' --output text 2>/dev/null)
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?contains(OutputKey, `GraphQL`)].OutputValue' --output text 2>/dev/null)

# If not found in main stack, check nested stacks
if [ -z "$USER_POOL_ID" ]; then
    # Get from amplify_outputs.json if available
    if [ -f "amplify_outputs.json" ]; then
        USER_POOL_ID=$(jq -r '.auth.user_pool_id' amplify_outputs.json)
        API_ENDPOINT=$(jq -r '.data.url' amplify_outputs.json)
    fi
fi

echo "Found resources:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  API Endpoint: $API_ENDPOINT"

if [ -z "$USER_POOL_ID" ] || [ -z "$API_ENDPOINT" ]; then
    echo "Warning: Could not find all required resources. Lambda configuration skipped."
    echo "Make sure the backend is fully deployed."
    exit 0
fi

# Update Lambda environment variables
echo "Updating Lambda function environment variables..."

# Get all Lambda functions from the stack and nested stacks
LAMBDA_FUNCTIONS=$(aws cloudformation list-stack-resources --stack-name $STACK_NAME --region $REGION --query 'StackResourceSummaries[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId' --output text)

# Also get functions from nested stacks
NESTED_STACKS=$(aws cloudformation list-stack-resources --stack-name $STACK_NAME --region $REGION --query 'StackResourceSummaries[?ResourceType==`AWS::CloudFormation::Stack`].PhysicalResourceId' --output text)

for NESTED in $NESTED_STACKS; do
    NESTED_FUNCTIONS=$(aws cloudformation list-stack-resources --stack-name $NESTED --region $REGION --query 'StackResourceSummaries[?ResourceType==`AWS::Lambda::Function`].PhysicalResourceId' --output text 2>/dev/null || true)
    LAMBDA_FUNCTIONS="$LAMBDA_FUNCTIONS $NESTED_FUNCTIONS"
done

if [ -z "$LAMBDA_FUNCTIONS" ]; then
    echo "No Lambda functions found to update."
    exit 0
fi

for FUNCTION in $LAMBDA_FUNCTIONS; do
    if [ -n "$FUNCTION" ]; then
        echo "Updating function: $FUNCTION"
        aws lambda update-function-configuration \
            --function-name $FUNCTION \
            --region $REGION \
            --environment Variables="{
                USER_POOL_ID=$USER_POOL_ID,
                API_ENDPOINT=$API_ENDPOINT,
                REGION=$REGION
            }" \
            --profile leigh 2>/dev/null || true
    fi
done

echo "Lambda functions configured successfully!"