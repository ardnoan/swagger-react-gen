// src/generators/configGenerator.js

export function generateApiConfigFile(baseUrl, options = {}) {
  return `// API Configuration
// Main configuration for API client

export const ApiConfig = {
  // Base URL - can be overridden by environment variable
  baseUrl: process.env.REACT_APP_API_BASE_URL || '${baseUrl || 'http://localhost:3000/api'}',
  
  // Request timeout in milliseconds
  timeout: ${options.timeout || 30000},
  
  // Number of retry attempts for failed requests
  retries: ${options.retries || 3},
  
  // Enable request/response logging
  enableLogging: process.env.NODE_ENV === 'development' || ${options.enableLogging || false},
  
  // Default headers for all requests
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Request interceptors
  interceptors: {
    request: [],
    response: []
  }
};

// Add request interceptor
export function addRequestInterceptor(interceptor) {
  ApiConfig.interceptors.request.push(interceptor);
}

// Add response interceptor  
export function addResponseInterceptor(interceptor) {
  ApiConfig.interceptors.response.push(interceptor);
}

// Apply request interceptors
export function applyRequestInterceptors(config) {
  return ApiConfig.interceptors.request.reduce(
    (config, interceptor) => interceptor(config) || config, 
    config
  );
}

// Apply response interceptors
export function applyResponseInterceptors(response) {
  return ApiConfig.interceptors.response.reduce(
    (response, interceptor) => interceptor(response) || response,
    response
  );
}

// Default export
export default ApiConfig;
`;
}

export function generateErrorHandlerFile() {
  return `// Error Handler
// Centralized error handling for API requests

export const ApiErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR', 
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export class ApiError extends Error {
  constructor(message, status, type, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.response = response;
  }
}

// Main error handler
export function handleApiError(error) {
  // If it's already an ApiError, just rethrow
  if (error instanceof ApiError) {
    throw error;
  }

  let errorType = ApiErrorTypes.UNKNOWN_ERROR;
  let message = error.message || 'An unknown error occurred';

  // Handle HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        errorType = ApiErrorTypes.VALIDATION_ERROR;
        message = 'Bad Request: Please check your input data';
        break;
      case 401:
        errorType = ApiErrorTypes.AUTHENTICATION_ERROR;
        message = 'Unauthorized: Please check your authentication credentials';
        break;
      case 403:
        errorType = ApiErrorTypes.AUTHORIZATION_ERROR;
        message = 'Forbidden: You do not have permission to access this resource';
        break;
      case 404:
        errorType = ApiErrorTypes.NOT_FOUND_ERROR;
        message = 'Not Found: The requested resource was not found';
        break;
      case 408:
        errorType = ApiErrorTypes.TIMEOUT_ERROR;
        message = 'Request Timeout: The request took too long to complete';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = ApiErrorTypes.SERVER_ERROR;
        message = 'Server Error: Please try again later';
        break;
      default:
        message = \`HTTP \${error.status}: \${error.message || 'Request failed'}\`;
    }
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    errorType = ApiErrorTypes.NETWORK_ERROR;
    message = 'Network Error: Please check your connection';
  } else if (error.name === 'AbortError') {
    errorType = ApiErrorTypes.TIMEOUT_ERROR;
    message = 'Request was cancelled or timed out';
  }

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', {
      type: errorType,
      status: error.status,
      message: message,
      originalError: error
    });
  }

  // Create and throw ApiError
  const apiError = new ApiError(message, error.status, errorType, error.response);
  throw apiError;
}

// Error handler for specific types
export const errorHandlers = {
  [ApiErrorTypes.AUTHENTICATION_ERROR]: (error) => {
    // Could trigger logout or redirect to login
    console.warn('Authentication error occurred:', error.message);
    return error;
  },
  
  [ApiErrorTypes.NETWORK_ERROR]: (error) => {
    // Could show network status or retry prompt
    console.warn('Network error occurred:', error.message);
    return error;
  },
  
  [ApiErrorTypes.SERVER_ERROR]: (error) => {
    // Could show maintenance message
    console.warn('Server error occurred:', error.message);
    return error;
  }
};

// Handle error with specific handler
export function handleErrorWithType(error) {
  const handler = errorHandlers[error.type];
  if (handler) {
    return handler(error);
  }
  return error;
}

export default handleApiError;
`;
}