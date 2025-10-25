import { join, dirname } from 'node:path';
import { mkdir, access, constants } from 'node:fs/promises';
import { KAGGLE_CONFIG } from '../../infrastructure/config.js';
import { findLatestDirectory } from '../utils/fs.js';
import { analyzeDirectory } from './analyze.js';
import { generateReport } from './report.js';

/**
 * Runs the complete inventory analysis workflow.
 *
 * This function orchestrates the full inventory process:
 * 1. Determines the target directory (uses latest if not specified)
 * 2. Analyzes the directory to gather file statistics
 * 3. Generates a Markdown report
 * 4. Saves the report to the specified location
 *
 * @param targetDir - Optional directory to analyze. If not provided, uses the latest directory from KAGGLE_CONFIG.dataRoot
 * @param outputPath - Optional path for the report. If not provided, generates a default path in KAGGLE_CONFIG.reportsDir
 * @returns Exit code: 0 for success, 1 for failure
 *
 * @example
 * ```typescript
 * // Analyze specific directory
 * const exitCode = await runInventory('./data/kaggle_raw/20240101');
 *
 * // Use latest directory and custom output
 * const exitCode = await runInventory(undefined, './reports/my_report.md');
 *
 * // Use all defaults
 * const exitCode = await runInventory();
 * ```
 */
export async function runInventory(targetDir?: string, outputPath?: string): Promise<number> {
  try {
    // Determine target directory
    let directory: string;

    if (targetDir) {
      // Validate that target directory exists and is readable
      try {
        await access(targetDir, constants.R_OK);
        directory = targetDir;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `Target directory does not exist or is not readable: ${targetDir} (${errorMessage})`
        );
        return 1;
      }
    } else {
      // Find the latest directory in the data root
      try {
        directory = await findLatestDirectory(
          KAGGLE_CONFIG.dataRoot,
          /^\d{8}$/ // YYYYMMDD pattern
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `No download directories found (${errorMessage}). Please run download first.`
        );
        return 1;
      }
    }

    console.log(`Analyzing directory: ${directory}`);

    // Analyze the directory
    const analysis = await analyzeDirectory(directory);

    if (!analysis) {
      console.error(
        `Failed to analyze directory: ${directory}. Manifest may be missing or invalid.`
      );
      return 1;
    }

    console.log(`Found ${analysis.summary.total_files} files`);
    console.log(`Unique patterns: ${Object.keys(analysis.patterns).length}`);
    console.log(`Chains: ${Object.keys(analysis.chains).join(', ')}`);
    console.log(`File types: ${Object.keys(analysis.fileTypes).join(', ')}`);

    // Determine output path
    let reportPath: string;

    if (outputPath) {
      reportPath = outputPath;
    } else {
      // Generate default report path
      const dateStr = new Date().toISOString().split('T')[0];
      const date = dateStr
        ? dateStr.replace(/-/g, '')
        : new Date().toISOString().slice(0, 10).replace(/-/g, '');
      reportPath = join(KAGGLE_CONFIG.reportsDir, `kaggle_inventory_${date}.md`);
    }

    // Ensure output directory exists
    await mkdir(dirname(reportPath), { recursive: true });

    // Generate and save report
    const savedPath = await generateReport(analysis, directory, reportPath);

    console.log(`Report saved to: ${savedPath}`);

    return 0;
  } catch (error) {
    console.error('Inventory workflow failed:', error);
    return 1;
  }
}
