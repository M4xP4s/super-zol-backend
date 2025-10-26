import { Command } from 'commander';
import { runProfile } from '../../lib/profile/index.js';
import { findLatestDirectory } from '../../lib/utils/fs.js';
import { KAGGLE_CONFIG } from '../../infrastructure/config.js';

/** Resolve data directory from options or find latest */
async function resolveDataDir(dataDir?: string): Promise<string> {
  if (dataDir) return dataDir;

  try {
    const dir = await findLatestDirectory(KAGGLE_CONFIG.dataRoot, /^\d{8}$/);
    console.log(`Using latest directory: ${dir}\n`);
    return dir;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(
      `✗ No download directories found: ${msg}\nPlease run download first or specify --data-dir`
    );
    process.exit(1);
  }
}

/** Create the 'profile' command for schema profiling */
export default function profileCommand(): Command {
  return new Command('profile')
    .description('Profile dataset schema and generate data profile report')
    .option('--data-dir <path>', 'Directory containing dataset files')
    .option('--output <path>', 'Output file path for profile JSON')
    .action(async (options) => {
      try {
        console.log('Profiling dataset schema...\n');
        const targetDir = await resolveDataDir(options.dataDir);
        const exitCode = await runProfile(targetDir, options.output);

        console.log(
          exitCode === 0
            ? '\n✓ Schema profiling completed successfully!'
            : '\n✗ Schema profiling failed'
        );
        void (
          options.output &&
          exitCode === 0 &&
          console.log(`Profile saved to: ${options.output}`)
        );

        process.exit(exitCode);
      } catch (error) {
        console.error('✗ Profile error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
