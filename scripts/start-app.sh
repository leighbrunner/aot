#!/bin/bash

echo "🚀 Starting Voting App..."

# Ensure AWS profile is set
export AWS_PROFILE=leigh

# Check if amplify_outputs.json exists
if [ ! -f "amplify_outputs.json" ]; then
    echo "❌ amplify_outputs.json not found. Run 'npx ampx sandbox --profile leigh' first."
    exit 1
fi

# Display backend info
echo ""
echo "📱 Backend Configuration:"
API_ENDPOINT=$(jq -r '.data.url' amplify_outputs.json)
USER_POOL_ID=$(jq -r '.auth.user_pool_id' amplify_outputs.json)
echo "  API: $API_ENDPOINT"
echo "  Auth: $USER_POOL_ID"
echo ""

# Check which platform to start
if [ "$1" = "ios" ]; then
    echo "📱 Starting iOS app..."
    npm run ios
elif [ "$1" = "android" ]; then
    echo "🤖 Starting Android app..."
    npm run android
elif [ "$1" = "web" ]; then
    echo "🌐 Starting Web app..."
    npm run web
else
    echo "Please specify a platform: ios, android, or web"
    echo "Usage: ./scripts/start-app.sh [ios|android|web]"
    echo ""
    echo "Available commands:"
    echo "  npm run ios     - Start iOS simulator"
    echo "  npm run android - Start Android emulator"
    echo "  npm run web     - Start web browser"
fi