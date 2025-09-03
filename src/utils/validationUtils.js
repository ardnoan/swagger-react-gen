import fs from 'fs';
import { HTTP_METHODS } from '../config/defaultConfig.js';

export async function validateInput(inputPath) {
  if (!inputPath) {
    throw new Error('Input path is required');
  }

  // Check if it's a URL
  if (inputPath.startsWith('http')) {
    try {
      new URL(inputPath);
    } catch (error) {
      throw new Error(`Invalid URL: ${inputPath}`);
    }
    return true;
  }

  // Check if it's a local file
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  if (!inputPath.endsWith('.json')) {
    throw new Error('Input file must be a JSON file');
  }

  return true;
}

export function validateSwaggerData(swaggerData) {
  if (!swaggerData) {
    throw new Error('Invalid Swagger data: empty or null');
  }

  if (!swaggerData.paths) {
    throw new Error('Invalid Swagger data: missing paths property');
  }

  if (!swaggerData.info) {
    console.warn('⚠️  Swagger data missing info property');
  }

  return true;
}

export function isValidHttpMethod(method) {
  return HTTP_METHODS.includes(method.toLowerCase());
}