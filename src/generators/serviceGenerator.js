// src/generators/serviceGenerator.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateServiceFile } from './serviceFileGenerator.js';
import { generateServicesIndexFile } from './indexGenerator.js';
import { generateReadmeFile } from './readmeGenerator.js';
import { fetchSwaggerSpec, parseSwaggerFile } from '../utils/fetchUtils.js';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔧 helper function untuk ubah jadi camelCase
function toCamelCase(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}

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
            const sanitizedTag = tag.replace(/[^a-zA-Z0-9\s]/g, ''); // hapus simbol aneh
            const camelTag = toCamelCase(sanitizedTag);

            if (!tagMap.has(camelTag)) {
              tagMap.set(camelTag, []);
            }

            tagMap.get(camelTag).push({
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
      const filename = `${tag}.service.js`; // ✅ konsisten
      const filePath = path.join(servicesDir, filename);

      const fileContent = generateServiceFile(tag, endpoints, baseUrl, options);
      fs.writeFileSync(filePath, fileContent, 'utf8');

      serviceFiles.push(filename);
      console.log(`✅ Generated service: services/${filename}`);
    }

    // Generate supporting files
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

  // Generate authHeader.js in config folder
  const authHeaderContent = generateAuthHeaderFile();
  fs.writeFileSync(path.join(configDir, 'authHeader.js'), authHeaderContent, 'utf8');
  console.log('✅ Generated: config/authHeader.js');

  // Generate services/index.js
  const servicesIndexContent = generateServicesIndexFile(serviceFiles);
  fs.writeFileSync(path.join(servicesDir, 'index.js'), servicesIndexContent, 'utf8');
  console.log('✅ Generated: services/index.js');

  // Generate main index.js
  const mainIndexContent = generateSimpleMainIndexFile(serviceFiles);
  fs.writeFileSync(path.join(outputDir, 'index.js'), mainIndexContent, 'utf8');
  console.log('✅ Generated: index.js');

  // Generate README.md
  const readmeContent = generateAxiosReadmeFile(swaggerData, serviceFiles);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf8');
  console.log('✅ Generated: README.md');
}

function generateAuthHeaderFile() {
  return `// Auth header utility for API requests
import { tokenUtils } from '../../utils/token';


export default function authHeader() {
  const token = tokenUtils.get();

  if (token) {
    return {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    };
  } else {
    return {
      'Content-Type': 'application/json'
    };
  }
}`;
}


function generateSimpleMainIndexFile(serviceFiles) {
  let content = `// Main entry point for API services\n\n`;

  // Import all services
  content += `// Import all services\n`;
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.js', '');
    content += `import ${serviceName} from './services/${filename}';\n`;
  });

  content += `\n// Export individual services\n`;
  content += `export {\n`;
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.js', '');
    content += `    ${serviceName},\n`;
  });
  content += `};\n\n`;

  // Export services object
  content += `// Export services object\n`;
  content += `export const services = {\n`;
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.js', '');
    const propName = serviceName.replace('Service', '').toLowerCase();
    content += `    ${propName}: ${serviceName},\n`;
  });
  content += `};\n\n`;

  content += `// Default export\n`;
  content += `export default services;\n`;

  return content;
}

function generateAxiosReadmeFile(swaggerData, serviceFiles) {
  const totalEndpoints = serviceFiles.reduce((acc) => acc + 5, 0);

  return `# Generated API Services (Axios Style)

Auto-generated from **${swaggerData.info?.title || 'API'}** v${swaggerData.info?.version || '1.0.0'}

## 📁 Project Structure

\`\`\`
src/api_generate/
├── index.js                    # Main entry point
├── README.md                   # This file
├── config/
│   └── authHeader.js          # Auth header utility
└── services/
    ├── index.js               # Service exports
${serviceFiles.map(file => `    └── ${file}               # Service class`).join('\n')}
\`\`\`

## 🚀 Usage in React

### Method 1: Import Individual Services (Recommended)
\`\`\`javascript
import authService from './api_generate/services/authService';
import userService from './api_generate/services/userService';

// Usage in component
function LoginComponent() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async (credentials) => {
        setLoading(true);
        try {
            const response = await authService.login(credentials);
            const { data } = response;
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(data));
            
            // Get user profile
            const profile = await authService.getProfile();
            console.log('User profile:', profile.data);
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    return <div>...</div>;
}
\`\`\`

### Method 2: Import from Main Index
\`\`\`javascript
import { authService, userService } from './api_generate';
// or
import { services } from './api_generate';

// Usage
const response = await services.auth.login(credentials);
\`\`\`

### Method 3: Import Services Object
\`\`\`javascript
import services from './api_generate/services';

// Usage
const response = await services.auth.login(credentials);
\`\`\`

## 📋 Service Features

✅ **Simple Class-based Structure**: Each service is a class with methods  
✅ **Automatic Auth Headers**: All requests (except login/register) include auth headers  
✅ **Axios Integration**: Uses axios for all HTTP requests  
✅ **Path Parameters**: Automatic handling of URL path parameters  
✅ **Query Parameters**: Support for GET request query parameters  
✅ **Error Handling**: Leverage axios error handling  

## 🔧 Usage Examples

### GET Request with Query Parameters
\`\`\`javascript
import userService from './api_generate/services/userService';

// GET /v1/users?page=1&limit=10&search=john
const response = await userService.getUsers({
    page: 1,
    limit: 10,
    search: 'john'
});
\`\`\`

### POST Request with Data
\`\`\`javascript
import userService from './api_generate/services/userService';

// POST /v1/users
const response = await userService.createUser({
    name: 'John Doe',
    email: 'john@example.com'
});
\`\`\`

### URL with Path Parameters
\`\`\`javascript
import userService from './api_generate/services/userService';

// PUT /v1/users/123
const response = await userService.updateUser(
    { name: 'Updated Name' },  // data
    { id: '123' }              // path params
);
\`\`\`

## ⚙️ Environment Variables

Add to your \`.env\` file:
\`\`\`bash
REACT_APP_API_BASE_URL=https://api.yourapp.com
\`\`\`

## 🔐 Authentication

The \`authHeader()\` function automatically includes the Bearer token from localStorage:

\`\`\`javascript
// Stored user object structure expected:
{
    "token": {
        "access_token": "your_jwt_token_here"
    }
}
\`\`\`

## 📊 Error Handling

Use try-catch blocks to handle errors:

\`\`\`javascript
try {
    const response = await authService.login(credentials);
    // Handle success
    console.log(response.data);
} catch (error) {
    // Handle error
    if (error.response) {
        // Server responded with error status
        console.error('Error:', error.response.data);
        console.error('Status:', error.response.status);
    } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
    } else {
        // Other error
        console.error('Error:', error.message);
    }
}
\`\`\`

## 📋 Statistics

- **Total Services**: ${serviceFiles.length}
- **Total Endpoints**: ${totalEndpoints}
- **Generated**: ${new Date().toLocaleString()}
- **Style**: Axios-based with class structure
`;
}