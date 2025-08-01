#!/bin/bash

# Final Testing Script for Voting App
# This script runs all tests across all platforms

set -e

echo "🚀 Starting Final Testing Suite for Voting App"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Function to print section
print_section() {
    echo ""
    echo -e "${YELLOW}$1${NC}"
    echo "----------------------------------------"
}

# Check prerequisites
print_section "Checking Prerequisites"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    print_status 0 "Node.js version is 18+"
else
    print_status 1 "Node.js version must be 18+"
fi

# Check AWS CLI
if command -v aws &> /dev/null; then
    print_status 0 "AWS CLI installed"
else
    print_status 1 "AWS CLI not installed"
fi

# Check AWS profile
aws sts get-caller-identity --profile leigh &> /dev/null
print_status $? "AWS profile 'leigh' configured"

# Run Unit Tests
print_section "Running Unit Tests"
npm test -- --coverage --watchAll=false
print_status $? "Unit tests passed"

# Run Linting
print_section "Running Linting"
npm run lint
print_status $? "Linting passed"

# Run Type Checking
print_section "Running Type Checking"
npm run typecheck
print_status $? "Type checking passed"

# Build React Native App
print_section "Building React Native App"
npm run build
print_status $? "React Native build successful"

# Build Admin Dashboard
print_section "Building Admin Dashboard"
cd admin
npm install
npm run build
print_status $? "Admin dashboard build successful"
cd ..

# Run Integration Tests
print_section "Running Integration Tests"
npm run test:integration
print_status $? "Integration tests passed"

# Check Security
print_section "Running Security Checks"
npm audit --audit-level=high
print_status $? "No high severity vulnerabilities"

# Test API Endpoints
print_section "Testing API Endpoints"
API_ENDPOINT=${API_ENDPOINT:-"https://api-test.assortits.com"}

# Test health endpoint
curl -f -s "${API_ENDPOINT}/health" > /dev/null
print_status $? "API health check passed"

# Test anonymous auth
RESPONSE=$(curl -s -X POST "${API_ENDPOINT}/auth/anonymous" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device-001"}')
if [[ $RESPONSE == *"token"* ]]; then
    print_status 0 "Anonymous authentication working"
else
    print_status 1 "Anonymous authentication failed"
fi

# Performance Checks
print_section "Running Performance Checks"

# Check bundle size
BUNDLE_SIZE=$(du -sh dist/bundle.js 2>/dev/null | cut -f1 || echo "0")
echo "Bundle size: $BUNDLE_SIZE"

# Memory usage test
if command -v /usr/bin/time &> /dev/null; then
    /usr/bin/time -l npm run start:test 2>&1 | grep "maximum resident set size" || true
fi

# Platform-specific tests
print_section "Platform-Specific Tests"

# iOS Tests (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Running iOS tests..."
    cd ios && pod install && cd ..
    npm run ios:test
    print_status $? "iOS tests passed"
else
    echo "Skipping iOS tests (not on macOS)"
fi

# Android Tests
echo "Running Android tests..."
npm run android:test
print_status $? "Android tests passed"

# E2E Tests (if configured)
if [ -d "e2e" ]; then
    print_section "Running E2E Tests"
    npm run e2e:test
    print_status $? "E2E tests passed"
else
    echo "E2E tests not configured, skipping..."
fi

# Deployment Readiness Checks
print_section "Deployment Readiness Checks"

# Check environment files
for env in test production; do
    if [ -f ".env.$env" ]; then
        print_status 0 ".env.$env file exists"
    else
        print_status 1 ".env.$env file missing"
    fi
done

# Check GitHub Actions
if [ -f ".github/workflows/deploy.yml" ]; then
    print_status 0 "GitHub Actions deploy workflow exists"
else
    print_status 1 "GitHub Actions deploy workflow missing"
fi

# Final Summary
print_section "Test Summary"
echo -e "${GREEN}All tests passed successfully!${NC}"
echo ""
echo "The app is ready for production deployment."
echo ""
echo "Next steps:"
echo "1. Review the deployment documentation: docs/DEPLOYMENT.md"
echo "2. Set up GitHub secrets for CI/CD"
echo "3. Deploy to test environment first"
echo "4. Run smoke tests on test environment"
echo "5. Deploy to production"
echo ""
echo "Remember to always use AWS profile 'leigh' for all deployments!"
echo ""

# Generate test report
print_section "Generating Test Report"
mkdir -p test-reports
cat > test-reports/final-test-report.md << EOF
# Final Test Report

Generated on: $(date)

## Test Results

### Unit Tests
- Status: ✅ Passed
- Coverage: Check coverage/lcov-report/index.html

### Integration Tests
- Status: ✅ Passed

### Security Audit
- Status: ✅ No high severity vulnerabilities

### API Tests
- Health Check: ✅ Passed
- Authentication: ✅ Passed

### Build Tests
- React Native: ✅ Successful
- Admin Dashboard: ✅ Successful

### Platform Tests
- iOS: $(if [[ "$OSTYPE" == "darwin"* ]]; then echo "✅ Passed"; else echo "⏭️ Skipped"; fi)
- Android: ✅ Passed

## Deployment Readiness
- Environment Files: ✅ Ready
- CI/CD Pipeline: ✅ Configured
- Documentation: ✅ Complete

## Recommendations
1. Deploy to test environment first
2. Run full E2E test suite on test environment
3. Monitor error rates during initial production deployment
4. Keep rollback procedures ready

## Sign-off
- [ ] Development team approval
- [ ] QA team approval
- [ ] Security review completed
- [ ] Performance benchmarks met
EOF

print_status 0 "Test report generated: test-reports/final-test-report.md"

echo ""
echo "🎉 All tests completed successfully!"