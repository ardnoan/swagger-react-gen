export function generateIndexFile(serviceFiles) {
  let content = `// Auto-generated API services index\n`;
  content += `// Import all services and re-export for easy access\n\n`;
  
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.service.js', '');
    content += `import * as ${serviceName}Service from './${filename}';\n`;
  });
  
  content += `\n// Export all services\n`;
  content += `export {\n`;
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.service.js', '');
    content += `  ${serviceName}Service,\n`;
  });
  content += `};\n\n`;
  
  content += `// Combined service object for convenience\n`;
  content += `export const ApiServices = {\n`;
  serviceFiles.forEach(filename => {
    const serviceName = filename.replace('.service.js', '');
    content += `  ${serviceName}: ${serviceName}Service,\n`;
  });
  content += `};\n\n`;
  
  content += `// Default export\n`;
  content += `export default ApiServices;\n`;
  
  return content;
}