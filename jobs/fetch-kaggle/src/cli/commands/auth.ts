import { Command } from 'commander';
import { ensureKaggleAuth } from '../../lib/auth/index.js';
import { checkEnvVars } from '../../lib/auth/env-check.js';
import { checkKaggleJson } from '../../lib/auth/kaggle-json.js';
import { verifyKaggleAPI } from '../../lib/auth/verify-api.js';

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

        let authenticated = false;

        if (options.checkOnly) {
          // Check-only mode: test env vars and kaggle.json without interactive setup
          const env = checkEnvVars();
          if (env) {
            console.log('Found credentials in environment variables');
            authenticated = await verifyKaggleAPI();
          }

          if (!authenticated) {
            const file = await checkKaggleJson();
            if (file) {
              console.log('Found credentials in kaggle.json');
              authenticated = await verifyKaggleAPI();
            }
          }

          if (!authenticated) {
            console.log('No valid credentials found');
            console.log('Run without --check-only to set up interactively');
          }
        } else {
          // Normal mode: run full auth flow including interactive setup
          authenticated = await ensureKaggleAuth();
        }

        if (authenticated) {
          console.log('✓ Authentication successful!');
          process.exit(0);
        } else {
          console.error('✗ Authentication failed');
          process.exit(1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('✗ Authentication error:', message);
        process.exit(1);
      }
    });

  return command;
}
