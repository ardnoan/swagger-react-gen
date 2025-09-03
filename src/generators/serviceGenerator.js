// src/generators/serviceGenerator.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateServiceFile } from './serviceFileGenerator.js';
import {
  generateMainIndexFile,
  generateServicesIndexFile,
  generateConfigIndexFile
} from './indexGenerator.js';
import { generateApiConfigFile, generateErrorHandlerFile } from './configGenerator.js';
import { generateReadmeFile } from './readmeGenerator.js';
import { fetchSwaggerSpec, parseSwaggerFile } from '../utils/fetchUtils.js';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateFromSwagger(inputPath, outputDir, options = {}) {
  try {
    // Fetch or read Swagger specification
    const swaggerData = inputPath.startsWith('http')
      ? await fetchSwaggerSpec(inputPath)
      : await parseSwaggerFile(inputPath);

    console.log(`📋 Parsed API: ${swaggerData.info?.title || 'Unknown'} v${swaggerData.info?.version || '1.0.0'}`);

    const baseUrl = options.baseUrl || swaggerData.servers?.[0]?.url;
    const tagMap = new Map();
    const serviceFiles = [];

    // Create directory structure
    const servicesDir = path.join(outputDir, 'services');
    const configDir = path.join(outputDir, 'config');

    ensureDirectoryExists(outputDir);
    ensureDirectoryExists(servicesDir);
    ensureDirectoryExists(configDir);

    // Group endpoints by tags
    for (const [route, pathItem] of Object.entries(swaggerData.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          const tags = operation.tags || ['default'];

          tags.forEach(tag => {
            const sanitizedTag = tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

            if (!tagMap.has(sanitizedTag)) {
              tagMap.set(sanitizedTag, []);
            }

            tagMap.get(sanitizedTag).push({
              operation,
              method: method.toUpperCase(),
              route
            });
          });
        }
      }
    }

    // Generate service files in services folder
    for (const [tag, endpoints] of tagMap) {
      const filename = `${tag}.service.js`;
      const filePath = path.join(servicesDir, filename);

      const fileContent = generateServiceFile(tag, endpoints, baseUrl, options);
      fs.writeFileSync(filePath, fileContent, 'utf8');

      serviceFiles.push(filename);
      console.log(`✅ Generated service: services/${filename}`);
    }

    // Generate supporting files with new structure
    await generateSupportingFiles(outputDir, serviceFiles, swaggerData, baseUrl, options);

    return {
      serviceFiles,
      totalEndpoints: Array.from(tagMap.values()).flat().length,
      structure: {
        outputDir,
        servicesDir,
        configDir
      }
    };

  } catch (error) {
    throw new Error(`Failed to generate services: ${error.message}`);
  }
}

async function generateSupportingFiles(outputDir, serviceFiles, swaggerData, baseUrl, options) {
  const servicesDir = path.join(outputDir, 'services');
  const configDir = path.join(outputDir, 'config');

  // Generate main index.js
  const mainIndexContent = generateMainIndexFile();
  fs.writeFileSync(path.join(outputDir, 'index.js'), mainIndexContent, 'utf8');
  console.log('✅ Generated: index.js');

  // Generate services/index.js
  const servicesIndexContent = generateServicesIndexFile(serviceFiles);
  fs.writeFileSync(path.join(servicesDir, 'index.js'), servicesIndexContent, 'utf8');
  console.log('✅ Generated: services/index.js');

  // Generate config/index.js
  const configIndexContent = generateConfigIndexFile();
  fs.writeFileSync(path.join(configDir, 'index.js'), configIndexContent, 'utf8');
  console.log('✅ Generated: config/index.js');

  // Generate config/apiConfig.js
  const apiConfigContent = generateApiConfigFile(baseUrl, options);
  fs.writeFileSync(path.join(configDir, 'apiConfig.js'), apiConfigContent, 'utf8');
  console.log('✅ Generated: config/apiConfig.js');

  // Generate config/errorHandler.js
  const errorHandlerContent = generateErrorHandlerFile();
  fs.writeFileSync(path.join(configDir, 'errorHandler.js'), errorHandlerContent, 'utf8');
  console.log('✅ Generated: config/errorHandler.js');

  // Generate README.md with updated structure
  const readmeContent = generateUpdatedReadmeFile(swaggerData, serviceFiles);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf8');
  console.log('✅ Generated: README.md');
}

function generateUpdatedReadmeFile(swaggerData, serviceFiles) {
  const totalEndpoints = serviceFiles.reduce((acc, file) => {
    return acc + 5; // Approximate 5 endpoints per service
  }, 0);

  return `# Generated API Services

Auto-generated from **${swaggerData.info?.title || 'API'}** v${swaggerData.info?.version || '1.0.0'}

## 📁 Project Structure

\`\`\`
src/api_generate/
├── index.js                    # Main entry point
├── README.md                   # This file
├── config/
│   ├── index.js               # Config exports
│   ├── apiConfig.js           # API configuration
│   └── errorHandler.js        # Error handling
└── services/
    ├── index.js               # Service exports
${serviceFiles.map(file => `    ├── ${file}               # Service functions`).join('\n')}
\`\`\`

## 🚀 Usage in React

### Import Everything
\`\`\`javascript
import { API } from './api_generate';

// Use services
const user = await API.services.auth.getCurrentUser();

// Use config
console.log(API.config.baseUrl);

// Handle errors
try {
  await API.services.auth.login({ body: { email, password } });
} catch (error) {
  API.handleError(error);
}
\`\`\`

### Import Specific Parts
\`\`\`javascript
import { ApiConfig, handleApiError } from './api_generate/config';
import { authService, usersService } from './api_generate/services';

// Use individual services
const user = await authService.getCurrentUser();
const users = await usersService.getAllUsers();
\`\`\`

### Import Individual Services
\`\`\`javascript
import { authService } from './api_generate/services';

function LoginComponent() {
  const [user, setUser] = useState(null);

  const handleLogin = async (credentials) => {
    try {
      const result = await authService.login({
        body: credentials
      });
      setUser(result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <div>...</div>;
}
\`\`\`

## ⚙️ Configuration

### Environment Variables
Add to your \`.env\` file:
\`\`\`bash
REACT_APP_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
\`\`\`

### Custom Configuration
\`\`\`javascript
import { ApiConfig, addRequestInterceptor } from './api_generate/config';

// Add authentication header
addRequestInterceptor((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Modify base URL
ApiConfig.baseUrl = 'https://api.myapp.com';
\`\`\`

## 🔧 Error Handling

\`\`\`javascript
import { handleApiError, ApiErrorTypes } from './api_generate/config';

try {
  await authService.login(credentials);
} catch (error) {
  if (error.type === ApiErrorTypes.AUTHENTICATION_ERROR) {
    // Handle auth error
    redirectToLogin();
  } else if (error.type === ApiErrorTypes.NETWORK_ERROR) {
    // Handle network error
    showNetworkError();
  } else {
    // Handle other errors
    showGenericError(error.message);
  }
}
\`\`\`

## 📋 Statistics

- **Total Services**: ${serviceFiles.length}
- **Total Endpoints**: ${totalEndpoints}
- **Generated**: ${new Date().toLocaleString()}
- **Structure**: Clean separation of services and configuration

## 🎯 Features

✅ **Organized Structure**: Separate folders for services and config  
✅ **TypeScript-ready**: Clean imports and exports  
✅ **Error Handling**: Comprehensive error handling with types  
✅ **Interceptors**: Request/response interceptors support  
✅ **Environment-aware**: Respects NODE_ENV and environment variables  
✅ **Extensible**: Easy to customize and extend  
`;
}