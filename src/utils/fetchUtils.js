import fetch from 'node-fetch';
import { readJsonFile } from './fileUtils.js';

export async function fetchSwaggerSpec(url) {
  try {
    console.log(`🌐 Fetching Swagger spec from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch Swagger spec: ${error.message}`);
  }
}

export async function parseSwaggerFile(inputPath) {
  try {
    if (inputPath.startsWith('http')) {
      return await fetchSwaggerSpec(inputPath);
    } else {
      return readJsonFile(inputPath);
    }
  } catch (error) {
    throw new Error(`Error parsing Swagger file: ${error.message}`);
  }
}