import { Command } from 'commander';
import { ensureKaggleAuth } from '../../lib/auth/index.js';
import { checkEnvVars } from '../../lib/auth/env-check.js';
import { checkKaggleJson } from '../../lib/auth/kaggle-json.js';
import { verifyKaggleAPI } from '../../lib/auth/verify-api.js';

/** Check auth status without interactive setup */
async function checkOnly(): Promise<boolean> {
  // Try env vars
  if (
    checkEnvVars() &&
    (console.log('Found credentials in environment variables'), await verifyKaggleAPI())
  ) {
    return true;
  }

  // Try kaggle.json
  if (
    (await checkKaggleJson()) &&
    (console.log('Found credentials in kaggle.json'), await verifyKaggleAPI())
  ) {
    return true;
  }

  // Nothing worked
  console.log('No valid credentials found\nRun without --check-only to set up interactively');
  return false;
}

/** Create the 'auth' command for Kaggle authentication */
export default function authCommand(): Command {
  return new Command('auth')
    .description('Authenticate with Kaggle (check env vars, kaggle.json, and API)')
    .option('--check-only', 'Check authentication status without interactive setup')
    .action(async (options) => {
      try {
        console.log('Checking Kaggle authentication...\n');
        const authenticated = options.checkOnly ? await checkOnly() : await ensureKaggleAuth();
        console.log(authenticated ? '✓ Authentication successful!' : '✗ Authentication failed');
        process.exit(authenticated ? 0 : 1);
      } catch (error) {
        console.error(
          '✗ Authentication error:',
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}
