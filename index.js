#!/usr/bin/env node

import { Command } from 'commander';
import { generateFromSwagger } from './src/generators/serviceGenerator.js';
import { validateInput } from './src/utils/validationUtils.js';
import { ensureDirectoryExists } from './src/utils/fileUtils.js';
import { CONFIG } from './src/config/defaultConfig.js';

const program = new Command();

program
  .name('swagger-react-gen')
  .description('Generate React API clients from Swagger/OpenAPI specifications')
  .version('1.0.0');

program
  .option('-i, --input <path>', 'Input Swagger/OpenAPI file (URL or local path)')
  .option('-o, --output <path>', 'Output directory', CONFIG.outputFolder)
  .option('--base-url <url>', 'Base API URL', CONFIG.defaultBaseUrl)
  .option('--enable-logging', 'Enable request/response logging', CONFIG.enableLogging);

program.parse(process.argv);

async function main() {
  const options = program.opts();
  
  if (!options.input) {
    console.error('❌ Error: Input file is required');
    console.log('Usage: swagger-react-gen --input <swagger.json> --output src/api');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting API generation...');
    console.log(`📂 Input: ${options.input}`);
    console.log(`📁 Output: ${options.output}`);
    
    // Validate input
    await validateInput(options.input);
    
    // Ensure output directory exists
    await ensureDirectoryExists(options.output);
    
    // Generate services
    const result = await generateFromSwagger(options.input, options.output, {
      baseUrl: options.baseUrl,
      enableLogging: options.enableLogging
    });
    
    console.log('\n🎉 Generation completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Services: ${result.serviceFiles.length}`);
    console.log(`   - Endpoints: ${result.totalEndpoints}`);
    console.log(`   - Files: ${result.serviceFiles.length + 2}`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);