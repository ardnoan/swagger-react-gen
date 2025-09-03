export const CONFIG = {
  defaultBaseUrl: process.env.REACT_APP_API_BASE_URL,
  enableLogging: process.env.NODE_ENV === 'development',
  outputFolder: 'src/api_generate',
  timeout: 30000,
  retries: 3
};

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];