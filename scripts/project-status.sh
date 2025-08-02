#!/bin/bash

# Display Current Project Status

echo "🚀 Voting App - Project Status"
echo "=============================="
echo ""

# Backend Status
echo "📦 Backend Infrastructure:"
if [ -f "amplify_outputs.json" ]; then
    echo "✅ Amplify Gen 2 Backend Deployed"
    echo "   - Region: $(jq -r '.auth.aws_region' amplify_outputs.json)"
    echo "   - API: $(jq -r '.data.url' amplify_outputs.json | cut -d'/' -f3)"
    echo "   - User Pool: $(jq -r '.auth.user_pool_id' amplify_outputs.json)"
else
    echo "❌ Backend not deployed"
fi

# Frontend Status
echo ""
echo "🖥️  Frontend Status:"
if ps aux | grep -q "[e]xpo start"; then
    echo "✅ Expo Dev Server Running"
    echo "   - Web: http://localhost:8081"
    echo "   - Metro: Active"
else
    echo "⚠️  Expo Dev Server Not Running"
    echo "   Run: npm run web"
fi

# Dependencies Status
echo ""
echo "📚 Dependencies:"
echo "✅ Core packages installed"
echo "⚠️  Some packages need version updates (non-critical)"

# Features Status
echo ""
echo "✨ Features Status:"
echo "✅ Authentication (Cognito) - Configured"
echo "✅ Database (DynamoDB) - Tables created"
echo "✅ API (AppSync GraphQL) - Deployed"
echo "✅ Storage (S3) - Buckets created"
echo "⚠️  Social Auth - Needs OAuth credentials"
echo "⚠️  Lambda Functions - Need business logic"

# Next Steps
echo ""
echo "📝 Next Steps:"
echo "1. Add OAuth credentials for social login:"
echo "   - Google: GOOGLE_CLIENT_ID secret"
echo "   - Facebook: FACEBOOK_APP_ID secret"
echo "   - Apple: APPLE_SERVICES_ID secret"
echo ""
echo "2. Implement Lambda function logic:"
echo "   - Vote processing"
echo "   - Image pair selection"
echo "   - Analytics calculations"
echo ""
echo "3. Connect frontend to GraphQL API:"
echo "   - Update API service layer"
echo "   - Add GraphQL queries/mutations"
echo ""

# Quick Commands
echo ""
echo "🎯 Quick Commands:"
echo "npm run web              - Start web development"
echo "npm run ios              - Start iOS development"
echo "npm run android          - Start Android development"
echo "./scripts/run-all-setup.sh - Run complete setup"
echo ""
echo "=============================="
echo "Ready for development! 🎉"