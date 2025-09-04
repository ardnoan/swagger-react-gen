// src/generators/serviceFileGenerator.js
import { sanitizeFunctionName, generateOperationId, extractPathParams } from '../utils/nameUtils.js';

export function generateServiceFile(tag, endpoints, baseUrl, options) {
  const className = `${tag.charAt(0).toUpperCase() + tag.slice(1)}Service`;

  let fileContent = `// Auto-generated service for ${tag}\n`;
  fileContent += `// Generated from OpenAPI/Swagger specification\n\n`;
  fileContent += `import axios from 'axios';\n`;
  fileContent += `import authHeader from '../config/authHeader.js';\n\n`;
  fileContent += `const API_URL = process.env.REACT_APP_API_BASE_URL || '${baseUrl}';\n\n`;

  fileContent += `class ${className} {\n`;

  endpoints.forEach(({ operation, method, route }) => {
    fileContent += generateServiceMethod(operation, method, route);
  });

  fileContent += `}\n\n`;
  fileContent += `export default new ${className}();\n`;

  return fileContent;
}

function generateServiceMethod(operation, method, route) {
  const funcName = sanitizeFunctionName(generateOperationId(method, route));
  const pathParams = extractPathParams(route);
  const upperMethod = method.toUpperCase();

  let methodContent = '';
  methodContent += `    /**\n`;
  methodContent += `     * ${operation.summary || `${method} ${route}`}\n`;
  methodContent += `     */\n`;

  // Method signature
  if (upperMethod === 'GET' || upperMethod === 'DELETE') {
    methodContent += `    ${funcName}(params = {}) {\n`;
  } else if (pathParams.length > 0) {
    methodContent += `    ${funcName}(data = {}, params = {}) {\n`;
  } else {
    methodContent += `    ${funcName}(data = {}) {\n`;
  }

  // URL builder
  if (pathParams.length > 0) {
    methodContent += `        let url = API_URL + '${route}';\n`;
    pathParams.forEach(param => {
      methodContent += `        if (params.${param}) url = url.replace('{${param}}', params.${param});\n`;
    });
  } else {
    methodContent += `        const url = API_URL + '${route}';\n`;
  }

  // Axios call (lebih simple)
  if (upperMethod === 'GET' || upperMethod === 'DELETE') {
    methodContent += `        return axios.${upperMethod.toLowerCase()}(url, { headers: authHeader(), params });\n`;
  } else {
    methodContent += `        return axios.${upperMethod.toLowerCase()}(url, data, { headers: { 'Content-Type': 'application/json', ...authHeader() } });\n`;
  }

  methodContent += `    }\n\n`;

  return methodContent;
}
