import { Command } from 'commander';
import { runInventory } from '../../lib/inventory/index.js';

/** Create the 'inventory' command for inventory analysis */
export default function inventoryCommand(): Command {
  return new Command('inventory')
    .description('Analyze dataset files and generate inventory report')
    .argument('[directory]', 'Target directory containing downloaded files (optional)')
    .action(async (directory) => {
      try {
        console.log('Analyzing dataset files...\n');
        const exitCode = await runInventory(directory);
        console.log(
          exitCode === 0
            ? '\n✓ Inventory analysis completed successfully!'
            : '\n✗ Inventory analysis failed'
        );
        process.exit(exitCode);
      } catch (error) {
        console.error('✗ Inventory error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
