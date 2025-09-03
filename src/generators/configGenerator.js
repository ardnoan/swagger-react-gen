export function generateConfigFile(baseUrl, options) {
  return `// API Configuration
export const ApiConfig = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || '${baseUrl}',
  timeout: ${options.timeout || 30000},
  retries: ${options.retries || 3},
  enableLogging: process.env.NODE_ENV === 'development' || ${options.enableLogging || false}
};

// Global error handler
export function handleApiError(error) {
  if (error.status) {
    switch (error.status) {
      case 401:
        console.error('Unauthorized: Please check your authentication');
        break;
      case 403:
        console.error('Forbidden: You do not have permission');
        break;
      case 404:
        console.error('Not Found: The requested resource was not found');
        break;
      case 500:
        console.error('Server Error: Please try again later');
        break;
      default:
        console.error(\`API Error (\${error.status}): \${error.message}\`);
    }
  } else {
    console.error('Network Error:', error.message);
  }
  throw error;
}

export default ApiConfig;
`;
}