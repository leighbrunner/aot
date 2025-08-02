#!/bin/bash

# Test React Native app connection to backend
echo "Testing backend connection..."

# Ensure we're using the leigh profile
export AWS_PROFILE=leigh

# Check if amplify_outputs.json exists
if [ ! -f "amplify_outputs.json" ]; then
    echo "❌ amplify_outputs.json not found. Run 'npx ampx sandbox --profile leigh' first."
    exit 1
fi

echo "✅ amplify_outputs.json found"

# Extract key values
API_ENDPOINT=$(jq -r '.data.url' amplify_outputs.json)
USER_POOL_ID=$(jq -r '.auth.user_pool_id' amplify_outputs.json)
IDENTITY_POOL_ID=$(jq -r '.auth.identity_pool_id' amplify_outputs.json)

echo ""
echo "Backend configuration:"
echo "  API Endpoint: $API_ENDPOINT"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Identity Pool ID: $IDENTITY_POOL_ID"

# Test API connectivity
echo ""
echo "Testing API connectivity..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}')

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    echo "✅ API is reachable (HTTP $RESPONSE)"
else
    echo "❌ API is not reachable (HTTP $RESPONSE)"
fi

# Test app bundle
echo ""
echo "Checking app dependencies..."
if npm list aws-amplify &>/dev/null; then
    echo "✅ aws-amplify is installed"
else
    echo "❌ aws-amplify is not installed. Run 'npm install' first."
fi

echo ""
echo "To test the app:"
echo "1. Make sure your device/emulator is running"
echo "2. Run: npm run ios     (for iOS)"
echo "3. Run: npm run android (for Android)"
echo "4. Run: npm run web     (for Web)"