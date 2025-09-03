import { sanitizeFunctionName, generateOperationId, extractPathParams } from '../utils/nameUtils.js';

export function generateServiceFile(tag, endpoints, baseUrl, options) {
  let fileContent = `// Auto-generated service for ${tag}\n`;
  fileContent += `// Generated from OpenAPI/Swagger specification\n\n`;
  
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
  fileContent += `}\n`;
  
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
  doc += ` * @returns {Promise<Object>} Response data\n`;
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
  
  // Log request jika enabled
  if (options.enableLogging) {
    func += `  if (${options.enableLogging}) {\n`;
    func += `    console.log('[API Request]', '${method.toUpperCase()} ${route}', { body, params, query });\n`;
    func += `  }\n\n`;
  }
  
  // Handle path parameters
  func += `  let endpoint = \`${route}\`;\n`;
  if (pathParams.length > 0) {
    pathParams.forEach(param => {
      func += `  if (params.${param} !== undefined) {\n`;
      func += `    endpoint = endpoint.replace('{${param}}', encodeURIComponent(params.${param}));\n`;
      func += `  }\n`;
    });
    func += `\n`;
  }
  
  // Construct URL dengan base URL
  func += `  const baseUrl = config.baseUrl || '${baseUrl}';\n`;
  func += `  const url = new URL(endpoint, baseUrl);\n\n`;
  
  // Handle query parameters untuk GET
  if (isGetMethod) {
    func += `  // Add query parameters\n`;
    func += `  Object.entries(query).forEach(([key, value]) => {\n`;
    func += `    if (value !== undefined && value !== null) {\n`;
    func += `      url.searchParams.append(key, value);\n`;
    func += `    }\n`;
    func += `  });\n\n`;
  }
  
  // Prepare request options
  func += `  const requestOptions = {\n`;
  func += `    method: '${method.toUpperCase()}',\n`;
  func += `    headers: {\n`;
  func += `      'Content-Type': 'application/json',\n`;
  func += `      ...headers\n`;
  func += `    },\n`;
  func += `    ...config\n`;
  func += `  };\n\n`;
  
  // Add body untuk non-GET methods
  if (!isGetMethod) {
    func += `  if (Object.keys(body).length > 0) {\n`;
    func += `    requestOptions.body = JSON.stringify(body);\n`;
    func += `  }\n\n`;
  }
  
  // Fetch request dengan error handling
  func += `  try {\n`;
  func += `    const response = await fetch(url.toString(), requestOptions);\n\n`;
  
  // Log response jika enabled
  if (options.enableLogging) {
    func += `    if (${options.enableLogging}) {\n`;
    func += `      console.log('[API Response]', response.status, response.statusText);\n`;
    func += `    }\n\n`;
  }
  
  func += `    if (!response.ok) {\n`;
  func += `      const errorText = await response.text();\n`;
  func += `      const error = new Error(\`HTTP \${response.status}: \${response.statusText}\`);\n`;
  func += `      error.status = response.status;\n`;
  func += `      error.response = errorText;\n`;
  func += `      throw error;\n`;
  func += `    }\n\n`;
  
  func += `    const contentType = response.headers.get('content-type');\n`;
  func += `    if (contentType && contentType.includes('application/json')) {\n`;
  func += `      return await response.json();\n`;
  func += `    }\n`;
  func += `    return await response.text();\n`;
  func += `  } catch (error) {\n`;
  func += `    console.error('[API Error]', error.message);\n`;
  func += `    throw error;\n`;
  func += `  }\n`;
  func += `}\n\n`;
  
  return { funcName, content: func };
}