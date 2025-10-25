import { Command } from 'commander';
import { ensureKaggleAuth } from '../../lib/auth/index.js';
import { runDownload } from '../../lib/download/index.js';
import { runInventory } from '../../lib/inventory/index.js';
import { runProfile } from '../../lib/profile/index.js';
import { findLatestDirectory } from '../../lib/utils/fs.js';
import { KAGGLE_CONFIG } from '../../infrastructure/config.js';

/**
 * Create the 'all' command for full workflow orchestration
 */
export default function allCommand(): Command {
  const command = new Command('all');

  command
    .description('Run complete workflow: auth → download → inventory → profile')
    .option('--dataset-id <id>', 'Kaggle dataset ID (e.g., username/dataset-name)')
    .option('--dry-run', 'Simulate download without actually downloading')
    .option('--data-dir <path>', 'Directory for dataset files')
    .option('--output <path>', 'Output file path for profile JSON')
    .action(async (options) => {
      try {
        console.log('╔════════════════════════════════════════╗');
        console.log('║   fetch-kaggle - Complete Workflow    ║');
        console.log('╚════════════════════════════════════════╝\n');

        // Step 1: Auth
        console.log('Step 1/4: Authenticating with Kaggle...');
        const authenticated = await ensureKaggleAuth();
        if (!authenticated) {
          console.error('✗ Authentication failed. Aborting workflow.');
          process.exit(1);
        }
        console.log('✓ Authentication successful\n');

        // Step 2: Download
        console.log('Step 2/4: Downloading dataset...');
        if (options.dryRun) {
          console.log('(DRY RUN MODE)\n');
        }
        const downloadCode = await runDownload({
          datasetId: options.datasetId,
          dryRun: options.dryRun || false,
        });
        if (downloadCode !== 0) {
          console.error('✗ Download failed. Aborting workflow.');
          process.exit(1);
        }
        console.log('✓ Download successful\n');

        // Resolve target directory for inventory and profile
        let targetDir = options.dataDir;
        if (!targetDir) {
          try {
            targetDir = await findLatestDirectory(
              KAGGLE_CONFIG.dataRoot,
              /^\d{8}$/ // YYYYMMDD pattern
            );
            console.log(`Using directory: ${targetDir}\n`);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`✗ Failed to locate download directory: ${message}`);
            process.exit(1);
          }
        }

        // Step 3: Inventory
        console.log('Step 3/4: Analyzing inventory...');
        const inventoryCode = await runInventory(targetDir);
        if (inventoryCode !== 0) {
          console.error('✗ Inventory analysis failed. Aborting workflow.');
          process.exit(1);
        }
        console.log('✓ Inventory analysis successful\n');

        // Step 4: Profile
        console.log('Step 4/4: Profiling schema...');
        const profileCode = await runProfile(targetDir, options.output);
        if (profileCode !== 0) {
          console.error('✗ Schema profiling failed. Aborting workflow.');
          process.exit(1);
        }
        console.log('✓ Schema profiling successful\n');

        // Summary
        console.log('╔════════════════════════════════════════╗');
        console.log('║    ✓ Workflow Completed Successfully   ║');
        console.log('╚════════════════════════════════════════╝\n');

        process.exit(0);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('✗ Workflow error:', message);
        process.exit(1);
      }
    });

  return command;
}
