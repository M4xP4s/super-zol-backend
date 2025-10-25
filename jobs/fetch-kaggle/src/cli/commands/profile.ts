import { Command } from 'commander';
import { runProfile } from '../../lib/profile/index.js';

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

        const exitCode = await runProfile(options.dataDir, options.output);

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
