# Voting App Testing Guide

## Overview

This guide covers all testing procedures for the Voting App, including unit tests, integration tests, end-to-end tests, and manual testing procedures.

## Test Environment Setup

### Prerequisites

```bash
# Install testing dependencies
npm install

# Install device simulators
# iOS (macOS only)
xcode-select --install

# Android
# Install Android Studio and set up emulators
```

### Environment Variables for Testing

```bash
# .env.test
NODE_ENV=test
API_ENDPOINT=http://localhost:3000
MOCK_AUTH=true
```

## Unit Testing

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- VotingCard.test.tsx
```

### Writing Unit Tests

Example test for a component:

```typescript
// src/components/VotingCard/__tests__/VotingCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VotingCard } from '../index';

describe('VotingCard', () => {
  const mockProps = {
    imageUrl: 'https://example.com/image.jpg',
    characterName: 'Test Character',
    categories: ['category1', 'category2'],
    onVote: jest.fn(),
  };

  it('renders correctly', () => {
    const { getByText } = render(<VotingCard {...mockProps} />);
    expect(getByText('Test Character')).toBeTruthy();
  });

  it('calls onVote when swiped', () => {
    const { getByTestId } = render(<VotingCard {...mockProps} />);
    fireEvent(getByTestId('voting-card'), 'swipeRight');
    expect(mockProps.onVote).toHaveBeenCalledWith('right');
  });
});
```

## Integration Testing

### API Integration Tests

```bash
# Run API integration tests
npm run test:integration

# Run with specific environment
API_ENV=staging npm run test:integration
```

### Database Integration Tests

```typescript
// __tests__/integration/database.test.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { votingService } from '../../src/services/api/votingService';

describe('Database Integration', () => {
  let client: DynamoDBClient;

  beforeAll(() => {
    client = new DynamoDBClient({ region: 'us-east-1' });
  });

  it('should save and retrieve votes', async () => {
    const vote = {
      winnerId: 'image1',
      loserId: 'image2',
      category: 'test',
      sessionId: 'test-session',
    };

    const result = await votingService.submitVote(vote);
    expect(result.voteId).toBeDefined();
  });
});
```

## End-to-End Testing

### Mobile App E2E Tests with Detox

```bash
# Build app for testing
npm run e2e:build:ios
npm run e2e:build:android

# Run E2E tests
npm run e2e:test:ios
npm run e2e:test:android
```

Example E2E test:

```javascript
// e2e/voting-flow.test.js
describe('Voting Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete a voting session', async () => {
    // Sign in anonymously
    await element(by.id('continue-anonymous')).tap();
    
    // Wait for images to load
    await waitFor(element(by.id('voting-card')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Swipe right to vote
    await element(by.id('voting-card')).swipe('right');
    
    // Verify next image loads
    await waitFor(element(by.id('voting-card')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

### Admin Dashboard E2E Tests with Cypress

```bash
# Run Cypress tests
cd admin
npm run cypress:open  # Interactive mode
npm run cypress:run   # Headless mode
```

## Performance Testing

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: 'https://api-test.assortits.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: 'Voting Flow'
    flow:
      - post:
          url: '/auth/anonymous'
          json:
            deviceId: '{{ $randomString() }}'
      - get:
          url: '/images/pair'
      - post:
          url: '/vote'
          json:
            winnerId: '{{ winnerId }}'
            loserId: '{{ loserId }}'
            category: 'test'
```

Run load tests:

```bash
artillery run load-test.yml
artillery report output.html
```

### Performance Benchmarks

Expected performance metrics:

- Image load time: < 500ms
- API response time: < 200ms (p95)
- App launch time: < 3 seconds
- Memory usage: < 150MB
- CPU usage: < 30% during normal use

## Security Testing

### 1. Authentication Tests

```bash
# Test unauthorized access
curl -X POST https://api-test.assortits.com/vote \
  -H "Content-Type: application/json" \
  -d '{"winnerId": "test", "loserId": "test"}'
# Should return 401 Unauthorized

# Test token expiration
# Use expired JWT token and verify rejection
```

### 2. Input Validation Tests

```javascript
// Test XSS prevention
const maliciousInput = '<script>alert("XSS")</script>';
const response = await api.submitVote({
  winnerId: maliciousInput,
  loserId: 'valid-id',
});
// Should sanitize or reject input
```

### 3. Rate Limiting Tests

```bash
# Test rate limiting
for i in {1..100}; do
  curl -X GET https://api-test.assortits.com/images/pair &
done
# Should start returning 429 after limit
```

## Manual Testing Checklist

### Core Functionality

- [ ] **Authentication Flow**
  - [ ] Anonymous sign-in works
  - [ ] Social login (Google, Facebook, Apple) works
  - [ ] Session persistence after app restart
  - [ ] Logout clears all data

- [ ] **Voting System**
  - [ ] Images load correctly
  - [ ] Swipe gestures work smoothly
  - [ ] Double-tap voting works
  - [ ] Vote submission succeeds
  - [ ] Next images preload properly
  - [ ] Offline votes queue correctly

- [ ] **Leaderboards**
  - [ ] All time periods load (daily/weekly/monthly/yearly)
  - [ ] Images display correctly
  - [ ] Infinite scroll works
  - [ ] Real-time updates appear

- [ ] **Profile**
  - [ ] Stats display correctly
  - [ ] Preferences calculate accurately
  - [ ] Voting history shows
  - [ ] Streak tracking works

### Edge Cases

- [ ] **Network Conditions**
  - [ ] Works on 3G/slow connections
  - [ ] Handles network disconnection
  - [ ] Resumes after connection restored
  - [ ] Shows appropriate error messages

- [ ] **Device Compatibility**
  - [ ] iPhone SE (small screen)
  - [ ] iPhone 14 Pro Max (large screen)
  - [ ] iPad (tablet)
  - [ ] Android phones (various sizes)
  - [ ] Notch/Dynamic Island handling

- [ ] **Accessibility**
  - [ ] VoiceOver/TalkBack works
  - [ ] Font scaling respected
  - [ ] Color contrast sufficient
  - [ ] Touch targets adequate size

### Admin Dashboard

- [ ] **Content Management**
  - [ ] Image approval/rejection works
  - [ ] Metadata editing saves
  - [ ] Bulk operations complete
  - [ ] Search and filters work

- [ ] **Analytics**
  - [ ] Dashboards load correctly
  - [ ] Data exports work
  - [ ] Real-time updates show
  - [ ] Date ranges filter properly

## Continuous Testing

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
npm run lint
npm run test:unit
```

### CI Pipeline Tests

GitHub Actions runs:
1. Linting checks
2. Unit tests with coverage
3. Integration tests
4. Build verification
5. Security scanning

### Monitoring in Production

- CloudWatch alarms for error rates
- Sentry for crash reporting
- Analytics for user behavior
- Performance monitoring with New Relic

## Test Data Management

### Seeding Test Data

```bash
# Seed test database
npm run seed:test

# Clean test data
npm run clean:test
```

### Test User Accounts

```
# Anonymous test user
Device ID: test-device-001

# Authenticated test users
Email: test1@example.com
Password: TestPass123!

Email: test2@example.com  
Password: TestPass123!

# Admin user
Email: admin@example.com
Password: AdminPass123!
```

## Debugging Failed Tests

### Common Issues

1. **Async timeout errors**
   ```javascript
   // Increase timeout for slow operations
   jest.setTimeout(10000);
   ```

2. **Mocking issues**
   ```javascript
   // Mock external dependencies
   jest.mock('@aws-amplify/auth');
   ```

3. **State pollution**
   ```javascript
   // Clean up after each test
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test with debugging
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Check test coverage gaps
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```

## Reporting Issues

When reporting test failures:

1. Include test output
2. Specify environment (OS, Node version, etc.)
3. Provide reproduction steps
4. Attach relevant logs
5. Note any recent changes

Template:
```
### Test Failure Report

**Test:** [Test name]
**Environment:** [OS, Node version, device]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Steps to reproduce:**
1. [Step 1]
2. [Step 2]

**Logs:**
```
[Paste relevant logs]
```
```