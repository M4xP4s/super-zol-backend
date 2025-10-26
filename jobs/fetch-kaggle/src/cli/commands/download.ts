import { Command } from 'commander';
import { runDownload } from '../../lib/download/index.js';

/** Create the 'download' command for dataset downloading */
export default function downloadCommand(): Command {
  return new Command('download')
    .description('Download Kaggle dataset and create manifest')
    .option('--dataset-id <id>', 'Kaggle dataset ID (e.g., username/dataset-name)')
    .option('--dry-run', 'Simulate download without actually downloading')
    .action(async (options) => {
      try {
        console.log('Starting dataset download...\n');
        void (options.dryRun && console.log('DRY RUN MODE - No files will be downloaded\n'));

        const exitCode = await runDownload({
          datasetId: options.datasetId,
          dryRun: options.dryRun || false,
        });

        console.log(
          exitCode === 0 ? '\n✓ Download completed successfully!' : '\n✗ Download failed'
        );
        process.exit(exitCode);
      } catch (error) {
        console.error('✗ Download error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
