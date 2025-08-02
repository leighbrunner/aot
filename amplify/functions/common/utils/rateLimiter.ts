import { lambdaCache } from './cache';

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (event: any) => string;
  skipSuccessfulRequests?: boolean;
}

/**
 * Token bucket algorithm for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillPerSecond: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillPerSecond;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  tryConsume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Rate limiter for Lambda functions
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private buckets = new Map<string, TokenBucket>();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request should be allowed
   */
  async checkLimit(event: any): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
  }> {
    const key = this.config.keyGenerator(event);
    const cacheKey = `ratelimit:${key}`;
    
    // Try to get from cache
    let entry = lambdaCache.get<RateLimitEntry>(cacheKey);
    
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    
    if (!entry || entry.windowStart < windowStart) {
      // New window
      entry = {
        count: 0,
        windowStart,
      };
    }
    
    const allowed = entry.count < this.config.maxRequests;
    
    if (allowed) {
      entry.count++;
      lambdaCache.set(cacheKey, entry, this.config.windowMs);
    }
    
    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetAt: windowStart + this.config.windowMs,
    };
  }

  /**
   * Create rate limit response
   */
  createRateLimitResponse(limit: number, remaining: number, resetAt: number): any {
    return {
      statusCode: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.floor(resetAt / 1000).toString(),
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      }),
    };
  }
}

/**
 * Create a rate limiter middleware for Lambda
 */
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);
  
  return function rateLimitMiddleware<T extends (...args: any[]) => any>(
    handler: T
  ): T {
    return (async (event: any, context: any, ...args: any[]) => {
      const result = await limiter.checkLimit(event);
      
      if (!result.allowed) {
        return limiter.createRateLimitResponse(
          result.limit,
          result.remaining,
          result.resetAt
        );
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(event, context, ...args);
      
      if (response && typeof response === 'object' && response.statusCode) {
        response.headers = {
          ...response.headers,
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(result.resetAt / 1000).toString(),
        };
      }
      
      return response;
    }) as T;
  };
}

/**
 * Common rate limiters
 */
export const rateLimiters = {
  // By IP address
  byIP: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (event) => 
      event.requestContext?.identity?.sourceIp || 'unknown',
  }),
  
  // By user ID
  byUser: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (event) => 
      event.requestContext?.authorizer?.claims?.sub || 'anonymous',
  }),
  
  // By API key
  byAPIKey: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
    keyGenerator: (event) => 
      event.headers?.['x-api-key'] || 'no-key',
  }),
  
  // Strict rate limit for expensive operations
  strict: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (event) => 
      event.requestContext?.authorizer?.claims?.sub || 
      event.requestContext?.identity?.sourceIp || 
      'unknown',
  }),
};

/**
 * Token bucket rate limiter for more flexible rate limiting
 */
export class TokenBucketRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly keyGenerator: (event: any) => string;

  constructor(
    capacity: number,
    refillPerSecond: number,
    keyGenerator: (event: any) => string
  ) {
    this.capacity = capacity;
    this.refillRate = refillPerSecond;
    this.keyGenerator = keyGenerator;
  }

  /**
   * Check if request should be allowed
   */
  checkLimit(event: any, tokensRequired: number = 1): boolean {
    const key = this.keyGenerator(event);
    
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(this.capacity, this.refillRate);
      this.buckets.set(key, bucket);
    }
    
    return bucket.tryConsume(tokensRequired);
  }

  /**
   * Get remaining tokens for a key
   */
  getRemainingTokens(event: any): number {
    const key = this.keyGenerator(event);
    const bucket = this.buckets.get(key);
    
    if (!bucket) {
      return this.capacity;
    }
    
    return bucket.getTokens();
  }
}