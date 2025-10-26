#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import authCommand from './commands/auth.js';
import downloadCommand from './commands/download.js';
import inventoryCommand from './commands/inventory.js';
import profileCommand from './commands/profile.js';
import allCommand from './commands/all.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cached version string to avoid repeated disk I/O
 * Read once at module load time and cached for CLI lifetime
 */
let cachedVersion: string | null = null;

/**
 * Get package version from package.json (cached)
 * Reads the file once and caches the result to avoid repeated I/O on every invocation
 */
function getVersion(): string {
  if (cachedVersion !== null) {
    return cachedVersion;
  }

  try {
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version || '1.0.0';
    cachedVersion = version;
    return version;
  } catch {
    // If we can't read the version, cache the default
    cachedVersion = '1.0.0';
    return '1.0.0';
  }
}

/**
 * Initialize and configure CLI
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('fetch-kaggle')
    .description('Kaggle dataset fetching and profiling tool')
    .version(getVersion());

  // Add commands
  program.addCommand(authCommand());
  program.addCommand(downloadCommand());
  program.addCommand(inventoryCommand());
  program.addCommand(profileCommand());
  program.addCommand(allCommand());

  // Parse arguments and execute
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}

// Execute CLI
main().catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
