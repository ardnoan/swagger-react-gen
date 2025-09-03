// src/generators/indexGenerator.js
export function generateMainIndexFile() {
  return `// Auto-generated API client
// Main entry point for all API services and configuration

// Import configurations
import ApiConfig, { handleApiError } from './config/index.js';

// Import services  
import * as Services from './services/index.js';

// Re-export everything for convenience
export { ApiConfig, handleApiError };
export * from './services/index.js';

// Combined API object
export const API = {
  config: ApiConfig,
  services: Services.ApiServices,
  handleError: handleApiError,
  ...Services
};

// Default export
export default API;
`;
}

export function generateServicesIndexFile(serviceFiles) {
  let content = `// Auto-generated services index\n`;
  content += `// Import all services and re-export for easy access\n\n`;

  // Import individual services
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.service.js', '');
    content += `import * as ${serviceName}Service from './${filename}';\n`;
  });

  content += `\n// Export individual services\n`;
  content += `export {\n`;
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.service.js', '');
    content += `  ${serviceName}Service,\n`;
  });
  content += `};\n\n`;

  // Combined services object
  content += `// Combined services object for convenience\n`;
  content += `export const ApiServices = {\n`;
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.service.js', '');
    content += `  ${serviceName}: ${serviceName}Service,\n`;
  });
  content += `};\n\n`;

  // Helper function to get all service names
  content += `// Get all available service names\n`;
  content += `export function getAvailableServices() {\n`;
  content += `  return [${serviceFiles.map(f => `'${f.replace('.service.js', '')}'`).join(', ')}];\n`;
  content += `}\n\n`;

  content += `// Default export\n`;
  content += `export default ApiServices;\n`;

  return content;
}

export function generateConfigIndexFile() {
  return `// Configuration index
// Re-export all configuration modules

export { default as ApiConfig } from './apiConfig.js';
export { handleApiError, ApiErrorTypes } from './errorHandler.js';

// Default export - main config
export { default } from './apiConfig.js';
`;
}