import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
}

export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
}

export const withCors = (handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      }
    }

    try {
      const result = await handler(event)
      
      // Add CORS and security headers to response
      return {
        ...result,
        headers: {
          ...corsHeaders,
          ...securityHeaders,
          ...result.headers,
        },
      }
    } catch (error) {
      console.error('Handler error:', error)
      
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          ...securityHeaders,
        },
        body: JSON.stringify({ error: 'Internal server error' }),
      }
    }
  }
}

export const validateAdminAccess = (event: APIGatewayProxyEvent): boolean => {
  const claims = event.requestContext.authorizer?.claims
  const groups = claims?.['cognito:groups'] || []
  
  return groups.includes('admins')
}

export const rateLimiter = (() => {
  const requests = new Map<string, number[]>()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100

  return (identifier: string): boolean => {
    const now = Date.now()
    const userRequests = requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false // Rate limit exceeded
    }
    
    validRequests.push(now)
    requests.set(identifier, validRequests)
    
    return true
  }
})()

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove potential XSS attempts
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key])
      }
    }
    return sanitized
  }
  
  return input
}

export const validateRequestBody = (body: string | null, requiredFields: string[]): { valid: boolean; data?: any; error?: string } => {
  if (!body) {
    return { valid: false, error: 'Request body is required' }
  }

  try {
    const data = JSON.parse(body)
    
    // Check required fields
    for (const field of requiredFields) {
      if (!data[field]) {
        return { valid: false, error: `Missing required field: ${field}` }
      }
    }
    
    // Sanitize input
    const sanitizedData = sanitizeInput(data)
    
    return { valid: true, data: sanitizedData }
  } catch (error) {
    return { valid: false, error: 'Invalid JSON in request body' }
  }
}