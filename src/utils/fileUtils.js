import fs from 'fs';
import path from 'path';

export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
  return true;
}

export function writeFileWithLog(filePath, content) {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Generated: ${path.basename(filePath)}`);
  return true;
}

export function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${error.message}`);
  }
}