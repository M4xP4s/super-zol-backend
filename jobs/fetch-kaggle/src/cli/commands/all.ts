import { Command } from 'commander';
import { ensureKaggleAuth } from '../../lib/auth/index.js';
import { runDownload } from '../../lib/download/index.js';
import { runInventory } from '../../lib/inventory/index.js';
import { runProfile } from '../../lib/profile/index.js';
import { findLatestDirectory } from '../../lib/utils/fs.js';
import { KAGGLE_CONFIG } from '../../infrastructure/config.js';

type Step = { name: string; fn: () => Promise<number | boolean> };

/** Execute workflow step and exit on failure */
async function executeStep({ name, fn }: Step): Promise<void> {
  const result = await fn();
  if (!result || result !== 0) {
    console.error(`✗ ${name} failed. Aborting workflow.`);
    process.exit(1);
  }
  console.log(`✓ ${name} successful\n`);
}

/** Resolve data directory from options or find latest */
async function resolveDataDir(dataDir?: string): Promise<string> {
  if (dataDir) return dataDir;

  try {
    const dir = await findLatestDirectory(KAGGLE_CONFIG.dataRoot, /^\d{8}$/);
    console.log(`Using directory: ${dir}\n`);
    return dir;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to locate download directory: ${msg}`);
    process.exit(1);
  }
}

/** Create the 'all' command for full workflow orchestration */
export default function allCommand(): Command {
  return new Command('all')
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
        await executeStep({
          name: 'Authentication',
          fn: async () => ensureKaggleAuth(),
        });

        // Step 2: Download
        console.log('Step 2/4: Downloading dataset...');
        void (options.dryRun && console.log('(DRY RUN MODE)\n'));
        await executeStep({
          name: 'Download',
          fn: async () =>
            runDownload({ datasetId: options.datasetId, dryRun: options.dryRun || false }),
        });

        // Resolve directory
        const targetDir = await resolveDataDir(options.dataDir);

        // Step 3: Inventory
        console.log('Step 3/4: Analyzing inventory...');
        await executeStep({
          name: 'Inventory analysis',
          fn: async () => runInventory(targetDir),
        });

        // Step 4: Profile
        console.log('Step 4/4: Profiling schema...');
        await executeStep({
          name: 'Schema profiling',
          fn: async () => runProfile(targetDir, options.output),
        });

        console.log('╔════════════════════════════════════════╗');
        console.log('║    ✓ Workflow Completed Successfully   ║');
        console.log('╚════════════════════════════════════════╝\n');
        process.exit(0);
      } catch (error) {
        console.error('✗ Workflow error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
