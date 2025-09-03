#!/usr/bin/env node

import { Command } from 'commander';
import { generateFromSwagger } from './src/generators/serviceGenerator.js';
import { validateInput } from './src/utils/validationUtils.js';

const program = new Command();

program
  .name('swagger-react-gen')
  .description('Generate React API clients from Swagger/OpenAPI specifications')
  .version('1.0.0');

program
  .option('-i, --input <path>', 'Input Swagger/OpenAPI file path or URL')
  .option('-o, --output <path>', 'Output directory path', 'src/api_generate')
  .option('-b, --base-url <url>', 'Override base URL from swagger spec')
  .option('--enable-logging', 'Enable request/response logging')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
  .option('--retries <count>', 'Number of retry attempts', '3')
  .option('--clean', 'Clean output directory before generation')
  .parse();

const options = program.opts();

async function main() {
  try {
    // Validate required options
    if (!options.input) {
      console.error('❌ Error: Input path is required');
      console.log('\nUsage:');
      console.log('  swagger-react-gen --input <path> --output <path>');
      console.log('\nExamples:');
      console.log('  swagger-react-gen --input ./swagger.json --output ./src/api');
      console.log('  swagger-react-gen --input https://api.example.com/swagger.json --output ./src/api');
      process.exit(1);
    }

    // Validate input
    await validateInput(options.input);

    console.log('🚀 Starting API client generation...');
    console.log(`📥 Input: ${options.input}`);
    console.log(`📤 Output: ${options.output}`);

    // Prepare generation options
    const generationOptions = {
      baseUrl: options.baseUrl,
      enableLogging: options.enableLogging || false,
      timeout: parseInt(options.timeout) || 30000,
      retries: parseInt(options.retries) || 3,
      clean: options.clean || false
    };

    // Generate services
    const result = await generateFromSwagger(
      options.input,
      options.output,
      generationOptions
    );

    // Success message
    console.log('\n🎉 Generation completed successfully!');
    console.log(`📊 Generated ${result.serviceFiles.length} services with ${result.totalEndpoints} endpoints`);
    console.log(`📁 Files created in: ${options.output}`);
    console.log('\n📖 Check README.md for usage instructions');

  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);

    if (process.env.NODE_ENV === 'development') {
      console.error('\n🐛 Debug info:', error.stack);
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

// Run the main function
main();