import { Command } from 'commander';
import { runInventory } from '../../lib/inventory/index.js';

/**
 * Create the 'inventory' command for inventory analysis
 */
export default function inventoryCommand(): Command {
  const command = new Command('inventory');

  command
    .description('Analyze dataset files and generate inventory report')
    .argument('[directory]', 'Target directory containing downloaded files (optional)')
    .action(async (directory) => {
      try {
        console.log('Analyzing dataset files...\n');

        const exitCode = await runInventory(directory);

        if (exitCode === 0) {
          console.log('\n✓ Inventory analysis completed successfully!');
        } else {
          console.error('\n✗ Inventory analysis failed');
        }

        process.exit(exitCode);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('✗ Inventory error:', message);
        process.exit(1);
      }
    });

  return command;
}
