// src/utils/fileUtils.js
import fs from 'fs';
import path from 'path';

export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
  return true;
}

export function writeFileWithLog(filePath, content, category = '') {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);

  fs.writeFileSync(filePath, content, 'utf8');
  const displayPath = category ? `${category}/${path.basename(filePath)}` : path.basename(filePath);
  console.log(`✅ Generated: ${displayPath}`);
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

export function createDirectoryStructure(baseDir) {
  const structure = {
    base: baseDir,
    services: path.join(baseDir, 'services'),
    config: path.join(baseDir, 'config')
  };

  // Create all directories
  Object.values(structure).forEach(dir => {
    ensureDirectoryExists(dir);
  });

  return structure;
}

export function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        cleanDirectory(filePath);
        fs.rmdirSync(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    console.log(`🧹 Cleaned directory: ${dirPath}`);
  }
}

export function getRelativePath(from, to) {
  return path.relative(from, to).replace(/\\/g, '/');
}

export function validateOutputStructure(outputDir) {
  const structure = {
    base: outputDir,
    services: path.join(outputDir, 'services'),
    config: path.join(outputDir, 'config')
  };

  const missing = [];

  Object.entries(structure).forEach(([name, dir]) => {
    if (!fs.existsSync(dir)) {
      missing.push(name);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing directories: ${missing.join(', ')}`);
  }

  return structure;
}