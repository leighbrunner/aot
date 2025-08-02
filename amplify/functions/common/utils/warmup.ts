/**
 * Lambda warmup utilities to reduce cold starts
 */

export interface WarmupEvent {
  source?: string;
  'detail-type'?: string;
  __warmup?: boolean;
}

/**
 * Check if this is a warmup invocation
 */
export const isWarmupEvent = (event: any): boolean => {
  return !!(
    event.__warmup ||
    (event.source === 'aws.events' && event['detail-type'] === 'Scheduled Event') ||
    (event.source === 'serverless-plugin-warmup')
  );
};

/**
 * Handle warmup request
 */
export const handleWarmup = async (): Promise<any> => {
  console.log('Lambda warmup successful');
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Lambda is warm' }),
  };
};

/**
 * Initialize global connections/resources
 * These persist across Lambda invocations
 */
let initialized = false;
let cachedConnections: any = {};

export const initializeConnections = async () => {
  if (initialized) return cachedConnections;

  console.log('Initializing Lambda connections...');
  
  // Initialize any persistent connections here
  // For example: database connections, SDK clients, etc.
  
  initialized = true;
  return cachedConnections;
};

/**
 * Optimize Lambda handler wrapper
 */
export const optimizedHandler = <T extends (...args: any[]) => any>(
  handler: T
): T => {
  return (async (event: any, context: any, ...args: any[]) => {
    // Set context to not wait for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;

    // Handle warmup events
    if (isWarmupEvent(event)) {
      return handleWarmup();
    }

    // Initialize connections if needed
    await initializeConnections();

    // Execute actual handler
    return handler(event, context, ...args);
  }) as T;
};