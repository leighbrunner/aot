#!/bin/bash

# Test React Native App Functionality

echo "🧪 Testing React Native App Functionality..."
echo "========================================"

# Set AWS profile
export AWS_PROFILE=leigh

# 1. Check if backend is accessible
echo ""
echo "1️⃣ Checking Backend Connectivity..."
./scripts/test-backend-connection.sh

# 2. Check if Amplify outputs exist
echo ""
echo "2️⃣ Checking Amplify Configuration..."
if [ -f "amplify_outputs.json" ]; then
    echo "✅ amplify_outputs.json exists"
    echo "   API Endpoint: $(jq -r '.data.url' amplify_outputs.json)"
    echo "   User Pool ID: $(jq -r '.auth.user_pool_id' amplify_outputs.json)"
else
    echo "❌ amplify_outputs.json not found!"
fi

# 3. Check if app can load Amplify config
echo ""
echo "3️⃣ Testing Amplify Integration..."
node -e "
const amplifyConfig = require('./amplify_outputs.json');
console.log('✅ Amplify config loaded successfully');
console.log('   Region:', amplifyConfig.auth.aws_region);
console.log('   API Available:', !!amplifyConfig.data);
console.log('   Auth Available:', !!amplifyConfig.auth);
console.log('   Storage Available:', !!amplifyConfig.storage);
" 2>/dev/null || echo "❌ Failed to load Amplify config"

# 4. Test authentication flow
echo ""
echo "4️⃣ Testing Authentication Setup..."
if [ -f "amplify_outputs.json" ]; then
    USER_POOL_ID=$(jq -r '.auth.user_pool_id' amplify_outputs.json)
    CLIENT_ID=$(jq -r '.auth.user_pool_client_id' amplify_outputs.json)
    
    # Check if social providers are configured
    echo "   Social Auth Status:"
    aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --query 'UserPoolClient.SupportedIdentityProviders' \
        --output json 2>/dev/null | jq -r '.[]' | while read provider; do
        echo "   - $provider: ✅ Configured"
    done
fi

# 5. Check web app status
echo ""
echo "5️⃣ Checking Web App Status..."
if curl -s http://localhost:8081/ | grep -q "voting-app"; then
    echo "✅ Web app is running on http://localhost:8081"
    
    # Check if bundle loads successfully
    BUNDLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/index.ts.bundle?platform=web&dev=true&hot=false")
    if [ "$BUNDLE_STATUS" = "200" ]; then
        echo "✅ JavaScript bundle loads successfully"
    else
        echo "⚠️  JavaScript bundle returned status: $BUNDLE_STATUS"
    fi
else
    echo "❌ Web app is not accessible"
fi

# 6. Summary
echo ""
echo "========================================"
echo "📊 Test Summary:"
echo ""
echo "To fully test the app:"
echo "1. Open http://localhost:8081 in your browser"
echo "2. Check the browser console for any errors"
echo "3. Try to sign up or sign in"
echo "4. Test the voting functionality"
echo ""
echo "Known Issues:"
echo "- Social authentication needs real OAuth credentials"
echo "- Lambda functions need business logic implementation"
echo ""