# React Native Voting App - Complete Design Document

## Project Overview

A cross-platform React Native voting application where users choose between two images in various categories. The app supports multiple domains (assortits.com, kittensorpuppies.com, etc.) with separate deployments, features AI-generated content, comprehensive analytics, and future monetization capabilities.

## Critical Configuration

### AWS Profile
- **ALWAYS use AWS profile "leigh" for all AWS operations**
- Set environment variable: `export AWS_PROFILE=leigh`
- Verify profile before any AWS commands: `aws sts get-caller-identity --profile leigh`
- All CDK/Amplify commands must include: `--profile leigh`

### Development Environment
- Always run `export AWS_PROFILE=leigh` at the start of each terminal session
- Include profile in all AWS CLI commands
- For Amplify: `amplify init --profile leigh`
- For CDK: `cdk deploy --profile leigh`

## Technical Stack

### Frontend
- **Framework**: React Native with Expo (managed workflow)
- **UI Library**: React Native Paper (dark/light mode support)
- **State Management**: Zustand
- **Image Handling**: React Native Fast Image
- **Navigation**: React Navigation v6
- **Authentication**: AWS Amplify Auth (Cognito)

### Backend
- **Infrastructure**: AWS Amplify Gen 2 (TypeScript)
- **Database**: DynamoDB
- **API**: HTTP API Gateway + Lambda
- **Real-time**: AppSync Events
- **File Storage**: S3 + CloudFront
- **Authentication**: Cognito User Pools

### Development Tools
- **Language**: TypeScript
- **Testing**: Jest + React Native Testing Library
- **CI/CD**: GitHub Actions
- **IaC**: AWS CDK (via Amplify Gen 2)
- **Environments**: Test and Production

## Core Features

### 1. Voting System
- Binary choice between two images
- Prevent duplicate voting on same image pairs
- Track all votes with metadata (timestamp, user, location)
- Pre-load next images during voting for seamless experience
- Random image pair selection with category filtering
- Voting streaks and progress tracking

### 2. User Management
- Anonymous authentication by default
- Social login options (Google, Facebook, Apple)
- User preferences (ass/tits person calculation)
- Voting history tracking
- Profile customization

### 3. Content Management
- AI-generated images via manual admin triggers
- Manual approval workflow for all images
- Dynamic categories (admin-managed)
- Image grouping by character/person
- Metadata tagging (age range, nationality, etc.)
- Promotion system for featured content

### 4. Analytics & Leaderboards
- Real-time vote counting
- Top rated images (daily/weekly/monthly/yearly/all-time)
- User preference analytics
- Country-based voting patterns
- Category performance metrics

### 5. Admin Dashboard
- Web-based interface for content management
- Image approval/rejection workflow
- AI generation triggers
- Analytics viewing
- Category management
- User management
- Promotion controls

### 6. Monetization (Built but Disabled)
- Rewarded video ad integration
- Native ad placements
- Premium subscription tiers
- Image promotion system

## Database Schema

### DynamoDB Tables

#### 1. Images Table
```typescript
{
  PK: "IMAGE#${imageId}",
  SK: "METADATA",
  GSI1PK: "STATUS#${status}", // pending, approved, rejected
  GSI1SK: "CREATED#${timestamp}",
  GSI2PK: "CATEGORY#${category}",
  GSI2SK: "RATING#${rating}",
  GSI3PK: "CHARACTER#${characterId}",
  GSI3SK: "IMAGE#${imageId}",
  
  imageId: string,
  url: string,
  thumbnailUrl: string,
  characterId: string,
  characterName: string,
  categories: string[],
  metadata: {
    ageRange: string,
    nationality: string,
    bodyType: string,
    // ... other attributes
  },
  status: "pending" | "approved" | "rejected",
  source: "ai" | "user",
  promotionWeight: number, // 1-10, default 1
  createdAt: string,
  approvedAt?: string,
  approvedBy?: string
}
```

#### 2. Votes Table
```typescript
{
  PK: "USER#${userId}",
  SK: "VOTE#${voteId}",
  GSI1PK: "IMAGE#${winnerId}",
  GSI1SK: "VOTE#${timestamp}",
  GSI2PK: "DATE#${date}",
  GSI2SK: "VOTE#${timestamp}",
  
  voteId: string,
  userId: string,
  winnerId: string,
  loserId: string,
  category: string,
  timestamp: string,
  sessionId: string,
  country?: string
}
```

#### 3. Users Table
```typescript
{
  PK: "USER#${userId}",
  SK: "PROFILE",
  GSI1PK: "EMAIL#${email}",
  GSI1SK: "USER#${userId}",
  
  userId: string,
  email?: string,
  preferences: {
    primaryPreference?: "ass" | "tits",
    preferenceScore?: number
  },
  stats: {
    totalVotes: number,
    currentStreak: number,
    longestStreak: number,
    lastVoteDate?: string
  },
  createdAt: string
}
```

#### 4. Analytics Table
```typescript
{
  PK: "ANALYTICS#${type}#${period}",
  SK: "ITEM#${itemId}",
  
  type: "image" | "category" | "character",
  period: "day" | "week" | "month" | "year" | "all",
  date: string,
  itemId: string,
  voteCount: number,
  winCount: number,
  winRate: number
}
```

#### 5. Categories Table
```typescript
{
  PK: "CATEGORY#${categoryId}",
  SK: "METADATA",
  
  categoryId: string,
  displayName: string,
  type: "physical" | "demographic" | "style",
  options: string[],
  isActive: boolean,
  createdAt: string,
  createdBy: string
}
```

## API Endpoints

### Public APIs (HTTP API Gateway)

#### Voting
- `POST /vote` - Submit a vote
- `GET /images/pair` - Get random image pair
- `GET /user/stats` - Get user statistics
- `GET /user/history` - Get voting history

#### Leaderboards
- `GET /leaderboards/{period}` - Get top images
- `GET /analytics/countries` - Get country preferences
- `GET /analytics/categories` - Get category analytics

### Admin APIs (REST API Gateway with WAF)

#### Content Management
- `POST /admin/images/generate` - Trigger AI generation
- `GET /admin/images/pending` - Get pending images
- `PUT /admin/images/{id}/approve` - Approve image
- `PUT /admin/images/{id}/reject` - Reject image
- `PUT /admin/images/{id}/promote` - Set promotion weight

#### Category Management
- `GET /admin/categories` - List all categories
- `POST /admin/categories` - Create category
- `PUT /admin/categories/{id}` - Update category
- `DELETE /admin/categories/{id}` - Delete category

#### Analytics
- `GET /admin/analytics/overview` - Dashboard metrics
- `GET /admin/analytics/users` - User analytics
- `GET /admin/analytics/content` - Content performance

## Infrastructure Architecture

### AWS Services Configuration

#### S3 Buckets
```typescript
// Images bucket
const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
  bucketName: `${domainName}-images`,
  cors: [{
    allowedMethods: ['GET'],
    allowedOrigins: ['*'],
    allowedHeaders: ['*'],
    maxAge: 3600
  }],
  lifecycleRules: [{
    transitions: [{
      storageClass: s3.StorageClass.STANDARD_IA,
      transitionAfter: cdk.Duration.days(30)
    }]
  }]
});
```

#### CloudFront Distribution
```typescript
const distribution = new cloudfront.Distribution(this, 'CDN', {
  defaultBehavior: {
    origin: new origins.S3Origin(imagesBucket, {
      originAccessIdentity: oai
    }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN
  },
  priceClass: cloudfront.PriceClass.PRICE_CLASS_100
});
```

#### DynamoDB Configuration
```typescript
const votingTable = new dynamodb.Table(this, 'VotingTable', {
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.ON_DEMAND,
  stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
});

// Add GSIs for each table as specified in schema
```

## Image Generation & Approval Workflow

### AI Generation Process
1. Admin triggers generation via dashboard
2. Lambda function calls AI service (InstantID/fal.ai)
3. Generated images saved to S3 pending folder
4. DynamoDB record created with status="pending"
5. Admin notified of new images

### Approval Workflow
1. Admin views pending images in dashboard
2. For each image:
   - Set categories and metadata
   - Approve or reject
3. Approved images:
   - Moved to approved S3 folder
   - DynamoDB status updated
   - CloudFront cache invalidated
4. Rejected images:
   - Moved to rejected folder
   - DynamoDB status updated

## Security Implementation

### Authentication
- Cognito User Pools with social providers
- Anonymous authentication for frictionless onboarding
- JWT tokens with 1-hour expiry
- Refresh tokens with 30-day expiry

### API Security
- API Gateway throttling: 1000 req/min per user
- WAF rules for admin endpoints
- CORS configuration for domain restrictions
- Request signing for admin APIs

### Image Security
- CloudFront signed URLs for premium content
- S3 bucket policies blocking direct access
- Origin Access Identity (OAI) for CloudFront

## Performance Optimizations

### Image Loading
- Preload next 3 image pairs during voting
- Progressive JPEG encoding
- Multiple sizes: thumbnail (150x150), medium (600x600), full
- WebP format with JPEG fallback
- 30-day browser cache headers

### Database Optimization
- Compound indexes for common queries
- DynamoDB auto-scaling enabled
- Batch write operations for analytics
- Eventually consistent reads where appropriate

### API Optimization
- Lambda reserved concurrency: 100
- Lambda memory: 1024MB for image processing
- API Gateway caching for leaderboards (5 min TTL)
- Connection pooling for database

## Monitoring & Logging

### CloudWatch Dashboards
- API request rates and latency
- Lambda errors and duration
- DynamoDB throttles and capacity
- S3 request metrics
- CloudFront cache hit rates

### Alarms
- API 5xx errors > 1% (1 min)
- Lambda errors > 1% (5 min)
- DynamoDB throttles > 0 (1 min)
- Image generation failures > 2 (5 min)

## Development Workflow

### Environment Setup
```bash
# Install dependencies
npm install -g @aws-amplify/cli@latest
npm install

# Initialize Amplify
amplify init

# Add authentication
amplify add auth

# Add API
amplify add api

# Add storage
amplify add storage

# Deploy
amplify push
```

### Project Structure
```
voting-app/
├── amplify/
│   ├── backend/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── function/
│   │   └── storage/
│   └── team-provider-info.json
├── src/
│   ├── components/
│   │   ├── VotingCard/
│   │   ├── Leaderboard/
│   │   └── Profile/
│   ├── screens/
│   │   ├── VotingScreen/
│   │   ├── LeaderboardScreen/
│   │   └── ProfileScreen/
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   └── analytics/
│   ├── store/
│   │   └── voting.store.ts
│   └── utils/
├── admin/
│   ├── components/
│   ├── pages/
│   └── services/
├── infrastructure/
│   ├── lib/
│   │   ├── voting-stack.ts
│   │   └── admin-stack.ts
│   └── bin/
└── package.json
```

### Key Commands
```bash
# Development
npm run dev:app      # Start React Native app
npm run dev:admin    # Start admin dashboard
npm run dev:backend  # Start local backend

# Testing
npm test            # Run all tests
npm run test:app    # Test React Native app
npm run test:admin  # Test admin dashboard

# Deployment
npm run deploy:test  # Deploy to test environment
npm run deploy:prod  # Deploy to production

# Infrastructure
npm run cdk:diff     # Show infrastructure changes
npm run cdk:deploy   # Deploy infrastructure
```

## Phase 2 Features (Not Included)

- User image submissions
- Instagram verification
- Social sharing features
- In-app purchases
- Push notifications
- Offline mode
- Video content support

## Configuration

### Environment Variables
```typescript
// .env.test
API_ENDPOINT=https://api-test.assortits.com
COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_CLIENT_ID=xxxxx
S3_BUCKET=assortits-test-images
CLOUDFRONT_URL=https://d1xxxxx.cloudfront.net

// .env.production
API_ENDPOINT=https://api.assortits.com
COGNITO_USER_POOL_ID=us-east-1_yyyyy
COGNITO_CLIENT_ID=yyyyy
S3_BUCKET=assortits-prod-images
CLOUDFRONT_URL=https://d2xxxxx.cloudfront.net
```

### Domain-Specific Configuration
```typescript
// config/domains.ts
export const domainConfig = {
  'assortits.com': {
    title: 'Ass or Tits',
    categories: ['ass', 'tits'],
    theme: 'adult',
    ageRestriction: 18
  },
  'kittensorpuppies.com': {
    title: 'Kittens or Puppies',
    categories: ['kittens', 'puppies'],
    theme: 'cute',
    ageRestriction: 0
  }
};
```

## Success Metrics

- Page load time < 2 seconds
- Image load time < 500ms
- API response time < 200ms (p95)
- 99.9% uptime
- < $100/month for 100k MAU
- Zero manual deployments

This design document provides the complete specification for building the voting application. All architectural decisions are final and optimized for scalability, performance, and cost-effectiveness.