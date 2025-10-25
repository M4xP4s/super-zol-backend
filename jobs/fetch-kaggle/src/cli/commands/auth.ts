import { Command } from 'commander';
import { ensureKaggleAuth } from '../../lib/auth/index.js';
import { checkEnvVars } from '../../lib/auth/env-check.js';
import { checkKaggleJson } from '../../lib/auth/kaggle-json.js';
import { verifyKaggleAPI } from '../../lib/auth/verify-api.js';

/**
 * Check authentication status without interactive setup
 * Tries environment variables first, then kaggle.json
 */
async function checkAuthenticationStatus(): Promise<boolean> {
  // Try environment variables
  if (checkEnvVars()) {
    console.log('Found credentials in environment variables');
    if (await verifyKaggleAPI()) {
      return true;
    }
  }

  // Try kaggle.json
  if (await checkKaggleJson()) {
    console.log('Found credentials in kaggle.json');
    if (await verifyKaggleAPI()) {
      return true;
    }
  }

  // No valid credentials found
  console.log('No valid credentials found');
  console.log('Run without --check-only to set up interactively');
  return false;
}

/**
 * Create the 'auth' command for Kaggle authentication
 */
export default function authCommand(): Command {
  const command = new Command('auth');

  command
    .description('Authenticate with Kaggle (check env vars, kaggle.json, and API)')
    .option('--check-only', 'Check authentication status without interactive setup')
    .action(async (options) => {
      try {
        console.log('Checking Kaggle authentication...\n');

        const authenticated = options.checkOnly
          ? await checkAuthenticationStatus()
          : await ensureKaggleAuth();

        if (authenticated) {
          console.log('✓ Authentication successful!');
          process.exit(0);
        }

        console.error('✗ Authentication failed');
        process.exit(1);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('✗ Authentication error:', message);
        process.exit(1);
      }
    });

  return command;
}
