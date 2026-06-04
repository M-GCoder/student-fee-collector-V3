import { defineConfig } from 'vitest/config';
import fs from 'fs';
import path from 'path';

// Load secrets from .project-config.json
try {
  const configPath = path.resolve(__dirname, '.project-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.secrets) {
      for (const [key, value] of Object.entries(config.secrets)) {
        process.env[key] = value as string;
      }
    }
  }
} catch (error) {
  console.error('Error loading secrets in vitest config:', error);
}

export default defineConfig({
  test: {
    environment: 'node',
  },
});
