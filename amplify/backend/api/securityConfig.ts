import { APIGatewayProxyResult } from 'aws-lambda'

export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://*.amazonaws.com https://*.cloudfront.net wss://*.amazonaws.com",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-User-Id,X-Is-Anonymous',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
}

export const addSecurityHeaders = (response: APIGatewayProxyResult): APIGatewayProxyResult => {
  return {
    ...response,
    headers: {
      ...response.headers,
      ...securityHeaders,
      ...corsHeaders,
    },
  }
}

// Rate limiting configuration
export const rateLimits = {
  vote: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 votes per minute
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute for admin
  },
}

// IP allowlist for admin endpoints
export const adminIpAllowlist = process.env.ADMIN_IP_ALLOWLIST?.split(',') || []

// Request size limits
export const requestLimits = {
  maxBodySize: 1024 * 1024, // 1MB
  maxUrlLength: 2048,
  maxHeaderSize: 8192,
}

// Sanitization patterns
export const sanitizationPatterns = {
  xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
  commandInjection: /[;&|`$()]/g,
}