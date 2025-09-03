// src/generators/serviceFileGenerator.js
import { sanitizeFunctionName, generateOperationId, extractPathParams } from '../utils/nameUtils.js';

export function generateServiceFile(tag, endpoints, baseUrl, options) {
  let fileContent = `// Auto-generated service for ${tag}\n`;
  fileContent += `// Generated from OpenAPI/Swagger specification\n\n`;
  fileContent += `import { ApiConfig, handleApiError, applyRequestInterceptors, applyResponseInterceptors } from '../config/index.js';\n\n`;

  const functions = [];

  endpoints.forEach(({ operation, method, route }) => {
    const { funcName, content } = generateServiceFunction(operation, method, route, baseUrl, options);
    functions.push(funcName);
    fileContent += content;
  });

  // Add helper function
  fileContent += `// Helper function to get all available functions in this service\n`;
  fileContent += `export function getAvailableFunctions() {\n`;
  fileContent += `  return [${functions.map(f => `'${f}'`).join(', ')}];\n`;
  fileContent += `}\n\n`;

  fileContent += `// Service metadata\n`;
  fileContent += `export const serviceInfo = {\n`;
  fileContent += `  name: '${tag}',\n`;
  fileContent += `  functions: getAvailableFunctions(),\n`;
  fileContent += `  totalEndpoints: ${endpoints.length}\n`;
  fileContent += `};\n`;

  return fileContent;
}

function generateFunctionDocumentation(operation, method, route) {
  let doc = `/**\n`;
  doc += ` * ${operation.summary || `${method} ${route}`}\n`;

  if (operation.description) {
    doc += ` * ${operation.description}\n`;
  }

  doc += ` * @param {Object} options - Request options\n`;

  if (method !== 'GET') {
    doc += ` * @param {Object} options.body - Request body data\n`;
  }

  const pathParams = extractPathParams(route);
  if (pathParams.length > 0) {
    doc += ` * @param {Object} options.params - Path parameters (${pathParams.join(', ')})\n`;
  }

  if (method === 'GET') {
    doc += ` * @param {Object} options.query - Query parameters\n`;
  }

  doc += ` * @param {Object} options.headers - Additional headers\n`;
  doc += ` * @param {Object} options.config - Override default config\n`;
  doc += ` * @returns {Promise<Object>} Response data\n`;
  doc += ` * @throws {ApiError} When request fails\n`;
  doc += ` */`;

  return doc;
}

function generateServiceFunction(operation, method, route, baseUrl, options) {
  const funcName = sanitizeFunctionName(operation.operationId || generateOperationId(method, route));
  const pathParams = extractPathParams(route);
  const isGetMethod = method.toUpperCase() === 'GET';

  const doc = generateFunctionDocumentation(operation, method, route);

  let func = `${doc}\n`;
  func += `export async function ${funcName}(options = {}) {\n`;
  func += `  const { body = {}, params = {}, query = {}, headers = {}, config = {} } = options;\n\n`;

  func += `  try {\n`;

  // Build endpoint with path parameters
  func += `    let endpoint = \`${route}\`;\n`;
  if (pathParams.length > 0) {
    pathParams.forEach(param => {
      func += `    if (params.${param} !== undefined) {\n`;
      func += `      endpoint = endpoint.replace('{${param}}', encodeURIComponent(params.${param}));\n`;
      func += `    }\n`;
    });
    func += `\n`;
  }

  // Merge configurations
  func += `    // Merge configurations\n`;
  func += `    const mergedConfig = { ...ApiConfig, ...config };\n`;
  func += `    const baseUrl = mergedConfig.baseUrl;\n`;
  func += `    const url = new URL(endpoint, baseUrl);\n\n`;

  // Handle query parameters for GET
  if (isGetMethod) {
    func += `    // Add query parameters\n`;
    func += `    Object.entries(query).forEach(([key, value]) => {\n`;
    func += `      if (value !== undefined && value !== null && value !== '') {\n`;
    func += `        if (Array.isArray(value)) {\n`;
    func += `          value.forEach(v => url.searchParams.append(key, v));\n`;
    func += `        } else {\n`;
    func += `          url.searchParams.append(key, value);\n`;
    func += `        }\n`;
    func += `      }\n`;
    func += `    });\n\n`;
  }

  // Prepare request configuration
  func += `    // Prepare request configuration\n`;
  func += `    let requestConfig = {\n`;
  func += `      method: '${method.toUpperCase()}',\n`;
  func += `      headers: {\n`;
  func += `        ...mergedConfig.defaultHeaders,\n`;
  func += `        ...headers\n`;
  func += `      },\n`;
  func += `      timeout: mergedConfig.timeout\n`;
  func += `    };\n\n`;

  // Add body for non-GET methods
  if (!isGetMethod) {
    func += `    // Add request body\n`;
    func += `    if (body && Object.keys(body).length > 0) {\n`;
    func += `      requestConfig.body = JSON.stringify(body);\n`;
    func += `    }\n\n`;
  }

  // Apply request interceptors
  func += `    // Apply request interceptors\n`;
  func += `    requestConfig = applyRequestInterceptors(requestConfig);\n\n`;

  // Log request if enabled
  func += `    // Log request if enabled\n`;
  func += `    if (mergedConfig.enableLogging) {\n`;
  func += `      console.log('[API Request]', '${method.toUpperCase()} ${route}', {\n`;
  func += `        url: url.toString(),\n`;
  func += `        headers: requestConfig.headers,\n`;
  if (!isGetMethod) {
    func += `        body,\n`;
  }
  if (isGetMethod) {
    func += `        query,\n`;
  }
  if (pathParams.length > 0) {
    func += `        params,\n`;
  }
  func += `      });\n`;
  func += `    }\n\n`;

  // Create abort controller for timeout
  func += `    // Setup timeout\n`;
  func += `    const controller = new AbortController();\n`;
  func += `    const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);\n`;
  func += `    requestConfig.signal = controller.signal;\n\n`;

  // Make the request
  func += `    // Make the request\n`;
  func += `    const response = await fetch(url.toString(), requestConfig);\n`;
  func += `    clearTimeout(timeoutId);\n\n`;

  // Log response if enabled
  func += `    // Log response if enabled\n`;
  func += `    if (mergedConfig.enableLogging) {\n`;
  func += `      console.log('[API Response]', response.status, response.statusText, {\n`;
  func += `        url: url.toString(),\n`;
  func += `        headers: Object.fromEntries(response.headers.entries())\n`;
  func += `      });\n`;
  func += `    }\n\n`;

  // Handle response
  func += `    // Check if response is ok\n`;
  func += `    if (!response.ok) {\n`;
  func += `      const errorText = await response.text();\n`;
  func += `      const error = new Error(\`HTTP \${response.status}: \${response.statusText}\`);\n`;
  func += `      error.status = response.status;\n`;
  func += `      error.response = errorText;\n`;
  func += `      throw error;\n`;
  func += `    }\n\n`;

  // Parse response
  func += `    // Parse response\n`;
  func += `    let responseData;\n`;
  func += `    const contentType = response.headers.get('content-type');\n`;
  func += `    \n`;
  func += `    if (contentType && contentType.includes('application/json')) {\n`;
  func += `      responseData = await response.json();\n`;
  func += `    } else if (contentType && contentType.includes('text/')) {\n`;
  func += `      responseData = await response.text();\n`;
  func += `    } else {\n`;
  func += `      responseData = await response.blob();\n`;
  func += `    }\n\n`;

  // Apply response interceptors
  func += `    // Apply response interceptors\n`;
  func += `    const processedResponse = applyResponseInterceptors({\n`;
  func += `      data: responseData,\n`;
  func += `      status: response.status,\n`;
  func += `      statusText: response.statusText,\n`;
  func += `      headers: response.headers\n`;
  func += `    });\n\n`;

  func += `    return processedResponse.data || responseData;\n\n`;

  // Error handling
  func += `  } catch (error) {\n`;
  func += `    // Handle and rethrow error\n`;
  func += `    handleApiError(error);\n`;
  func += `  }\n`;
  func += `}\n\n`;

  return { funcName, content: func };
}