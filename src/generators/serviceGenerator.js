import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateServiceFile } from './serviceFileGenerator.js';
import { generateIndexFile } from './indexGenerator.js';
import { generateConfigFile } from './configGenerator.js';
import { generateReadmeFile } from './readmeGenerator.js';
import { fetchSwaggerSpec, parseSwaggerFile } from '../utils/fetchUtils.js';

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
    
    // Generate service files
    for (const [tag, endpoints] of tagMap) {
      const filename = `${tag}.service.js`;
      const filePath = path.join(outputDir, filename);
      
      const fileContent = generateServiceFile(tag, endpoints, baseUrl, options);
      fs.writeFileSync(filePath, fileContent, 'utf8');
      
      serviceFiles.push(filename);
      console.log(`✅ Generated: ${filename}`);
    }
    
    // Generate supporting files
    generateSupportingFiles(outputDir, serviceFiles, swaggerData, baseUrl, options);
    
    return {
      serviceFiles,
      totalEndpoints: Array.from(tagMap.values()).flat().length
    };
    
  } catch (error) {
    throw new Error(`Failed to generate services: ${error.message}`);
  }
}

function generateSupportingFiles(outputDir, serviceFiles, swaggerData, baseUrl, options) {
  // Generate index.js
  const indexContent = generateIndexFile(serviceFiles);
  fs.writeFileSync(path.join(outputDir, 'index.js'), indexContent, 'utf8');
  console.log('✅ Generated: index.js');
  
  // Generate config.js
  const configContent = generateConfigFile(baseUrl, options);
  fs.writeFileSync(path.join(outputDir, 'config.js'), configContent, 'utf8');
  console.log('✅ Generated: config.js');
  
  // Generate README.md
  const readmeContent = generateReadmeFile(swaggerData, serviceFiles);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf8');
  console.log('✅ Generated: README.md');
}