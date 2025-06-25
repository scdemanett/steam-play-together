interface SteamApiError {
  message: string;
  userMessage: string;
  statusCode: number;
  retryAfter?: number;
}

export function handleSteamApiError(error: unknown): SteamApiError {
  const errorObj = error as { response?: { status?: number; data?: unknown; headers?: Record<string, string> }; code?: string; message?: string };
  const statusCode = errorObj.response?.status || 500;
  const responseData = errorObj.response?.data;
  
  // Handle specific status codes
  switch (statusCode) {
    case 429: {
      // Rate limiting
      const retryAfter = errorObj.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 300; // Default 5 minutes
      
      return {
        message: `Steam API rate limit exceeded (429). Retry after ${waitTime} seconds.`,
        userMessage: `You've made too many requests to Steam's servers. Please wait ${Math.ceil(waitTime / 60)} minutes before trying again. Steam limits API calls to prevent server overload.`,
        statusCode: 429,
        retryAfter: waitTime
      };
    }
    
    case 401:
      return {
        message: 'Steam API authentication failed (401)',
        userMessage: 'Your Steam API key is invalid or has expired. Please check your API key in settings.',
        statusCode: 401
      };
    
    case 403:
      return {
        message: 'Steam API access forbidden (403)',
        userMessage: 'Access denied. The Steam profile may be private, or your API key doesn\'t have permission for this action.',
        statusCode: 403
      };
    
    case 404:
      return {
        message: 'Steam API endpoint not found (404)',
        userMessage: 'The requested Steam user or data was not found. Please verify the Steam ID is correct.',
        statusCode: 404
      };
    
    case 500:
      return {
        message: 'Steam API server error (500)',
        userMessage: 'Steam\'s servers are experiencing issues. Please try again in a few minutes.',
        statusCode: 500
      };
    
    case 502:
    case 503:
    case 504:
      return {
        message: `Steam API service unavailable (${statusCode})`,
        userMessage: 'Steam\'s servers are temporarily unavailable. Please try again in a few minutes.',
        statusCode
      };
    
    default: {
      // Check if it's an HTML error response (common with nginx errors)
      if (typeof responseData === 'string' && responseData.includes('<html>')) {
        const titleMatch = responseData.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : 'Steam API Error';
        
        if (title.includes('429') || title.includes('Too Many Requests')) {
          return {
            message: 'Steam API rate limit exceeded (HTML response)',
            userMessage: 'You\'ve made too many requests to Steam\'s servers. Please wait 5-10 minutes before trying again.',
            statusCode: 429,
            retryAfter: 300
          };
        }
        
        return {
          message: `Steam API HTML error: ${title}`,
          userMessage: 'Steam\'s servers returned an unexpected response. Please try again in a few minutes.',
          statusCode: statusCode || 500
        };
      }
      
      // Network or other errors
      if (errorObj.code === 'ECONNREFUSED' || errorObj.code === 'ENOTFOUND') {
        return {
          message: `Network error: ${errorObj.code}`,
          userMessage: 'Unable to connect to Steam\'s servers. Please check your internet connection and try again.',
          statusCode: 503
        };
      }
      
      return {
        message: errorObj.message || 'Unknown Steam API error',
        userMessage: 'An unexpected error occurred while connecting to Steam. Please try again.',
        statusCode: statusCode || 500
      };
    }
  }
}

export function logSteamApiError(endpoint: string, error: unknown): void {
  const steamError = handleSteamApiError(error);
  const errorObj = error as { response?: { data?: unknown }; message?: string };
  console.error(`Steam API Error [${endpoint}]:`, {
    status: steamError.statusCode,
    message: steamError.message,
    originalError: errorObj.response?.data || errorObj.message,
    retryAfter: steamError.retryAfter
  });
} 