import { Command } from 'commander';
import { ensureKaggleAuth } from '../../lib/auth/index.js';

/**
 * Create the 'auth' command for Kaggle authentication
 */
export default function authCommand(): Command {
  const command = new Command('auth');

  command
    .description('Authenticate with Kaggle (check env vars, kaggle.json, and API)')
    .option('--check-only', 'Check authentication status without interactive setup')
    .action(async (_options) => {
      try {
        console.log('Checking Kaggle authentication...\n');

        const authenticated = await ensureKaggleAuth();

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
