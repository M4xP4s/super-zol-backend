import { Command } from 'commander';
import { runDownload } from '../../lib/download/index.js';

/**
 * Create the 'download' command for dataset downloading
 */
export default function downloadCommand(): Command {
  const command = new Command('download');

  command
    .description('Download Kaggle dataset and create manifest')
    .option('--dataset-id <id>', 'Kaggle dataset ID (e.g., username/dataset-name)')
    .option('--dry-run', 'Simulate download without actually downloading')
    .action(async (options) => {
      try {
        console.log('Starting dataset download...\n');

        if (options.dryRun) {
          console.log('DRY RUN MODE - No files will be downloaded\n');
        }

        const exitCode = await runDownload({
          datasetId: options.datasetId,
          dryRun: options.dryRun || false,
        });

        if (exitCode === 0) {
          console.log('\n✓ Download completed successfully!');
        } else {
          console.error('\n✗ Download failed');
        }

        process.exit(exitCode);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('✗ Download error:', message);
        process.exit(1);
      }
    });

  return command;
}
