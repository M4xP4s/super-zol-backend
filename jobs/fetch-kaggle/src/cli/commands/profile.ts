import { Command } from 'commander';
import { runProfile } from '../../lib/profile/index.js';
import { findLatestDirectory } from '../../lib/utils/fs.js';
import { KAGGLE_CONFIG } from '../../infrastructure/config.js';

/**
 * Create the 'profile' command for schema profiling
 */
export default function profileCommand(): Command {
  const command = new Command('profile');

  command
    .description('Profile dataset schema and generate data profile report')
    .option('--data-dir <path>', 'Directory containing dataset files')
    .option('--output <path>', 'Output file path for profile JSON')
    .action(async (options) => {
      try {
        console.log('Profiling dataset schema...\n');

        // Resolve directory: use provided path or find latest
        let targetDir = options.dataDir;
        if (!targetDir) {
          try {
            targetDir = await findLatestDirectory(
              KAGGLE_CONFIG.dataRoot,
              /^\d{8}$/ // YYYYMMDD pattern
            );
            console.log(`Using latest directory: ${targetDir}\n`);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`✗ No download directories found: ${message}`);
            console.error('Please run download first or specify --data-dir');
            process.exit(1);
          }
        }

        const exitCode = await runProfile(targetDir, options.output);

        if (exitCode === 0) {
          console.log('\n✓ Schema profiling completed successfully!');
          if (options.output) {
            console.log(`Profile saved to: ${options.output}`);
          }
        } else {
          console.error('\n✗ Schema profiling failed');
        }

        process.exit(exitCode);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('✗ Profile error:', message);
        process.exit(1);
      }
    });

  return command;
}
