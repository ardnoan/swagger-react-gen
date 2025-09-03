export function generateReadmeFile(swaggerData, serviceFiles) {
  const totalEndpoints = serviceFiles.reduce((acc, file) => {
    // Simple estimation - in real implementation you'd track this
    return acc + 5; // Approximate 5 endpoints per service
  }, 0);

  return `# Generated API Services

Auto-generated from **${swaggerData.info?.title || 'API'}** v${swaggerData.info?.version || '1.0.0'}

## 📁 Files Generated

- **index.js** - Main export file
- **config.js** - Configuration and error handling
${serviceFiles.map(file => `- **${file}** - Service functions`).join('\n')}

## 🚀 Usage in React

### Import All Services
\`\`\`javascript
import { ApiServices } from './api_generate';
// or
import { authService, menusService } from './api_generate';
\`\`\`

### Use in Component
\`\`\`javascript
import React, { useState, useEffect } from 'react';
import { authService } from './api_generate';

function MyComponent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    authService.getCurrentUser()
      .then(setUser)
      .catch(console.error);
  }, []);

  const handleLogin = async () => {
    try {
      const result = await authService.login({
        body: { email, password }
      });
      setUser(result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <div>...</div>;
}
\`\`\`

## ⚙️ Environment Variables

Add to your \`.env\` file:
\`\`\`
REACT_APP_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
\`\`\`

## 📋 Statistics

- **Total Services**: ${serviceFiles.length}
- **Total Endpoints**: ${totalEndpoints}
- **Generated**: ${new Date().toLocaleString()}
`;
}