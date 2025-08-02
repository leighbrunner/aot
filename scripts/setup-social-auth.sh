#!/bin/bash

# Script to re-enable social authentication
echo "Setting up social authentication..."

# Ensure we're using the leigh profile
export AWS_PROFILE=leigh

# Check if secrets exist with actual values (not placeholders)
check_secret() {
    local secret_name=$1
    local value=$(aws ssm get-parameter --name "/amplify/voting-app/$secret_name" --with-decryption --query 'Parameter.Value' --output text 2>/dev/null)
    
    if [[ -z "$value" ]] || [[ "$value" == "your-"* ]]; then
        echo "❌ $secret_name is not configured with a real value"
        return 1
    else
        echo "✅ $secret_name is configured"
        return 0
    fi
}

echo "Checking social authentication secrets..."
ALL_SECRETS_VALID=true

# Google OAuth
check_secret "GOOGLE_CLIENT_ID" || ALL_SECRETS_VALID=false
check_secret "GOOGLE_CLIENT_SECRET" || ALL_SECRETS_VALID=false

# Facebook OAuth
check_secret "FACEBOOK_CLIENT_ID" || ALL_SECRETS_VALID=false
check_secret "FACEBOOK_CLIENT_SECRET" || ALL_SECRETS_VALID=false

# Apple Sign In
check_secret "APPLE_CLIENT_ID" || ALL_SECRETS_VALID=false
check_secret "APPLE_KEY_ID" || ALL_SECRETS_VALID=false
check_secret "APPLE_PRIVATE_KEY" || ALL_SECRETS_VALID=false
check_secret "APPLE_TEAM_ID" || ALL_SECRETS_VALID=false

if [ "$ALL_SECRETS_VALID" = true ]; then
    echo ""
    echo "✅ All secrets are configured!"
    echo ""
    echo "To enable social authentication:"
    echo "1. Uncomment the social auth configuration in amplify/auth/resource.ts"
    echo "2. Run: npx ampx sandbox --profile leigh"
    echo ""
else
    echo ""
    echo "❌ Some secrets are missing or have placeholder values."
    echo ""
    echo "To configure secrets, run:"
    echo "aws ssm put-parameter --name '/amplify/voting-app/SECRET_NAME' --value 'actual-value' --type 'SecureString' --overwrite --profile leigh"
    echo ""
    echo "You need to:"
    echo "1. Create OAuth apps on Google, Facebook, and Apple developer consoles"
    echo "2. Update the secrets with actual client IDs and secrets"
    echo "3. Run this script again to verify"
fi