/**
 * Profile orchestrator for schema profiling workflow.
 * Coordinates profiling of downloaded CSV files.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { profileDirectory } from './directory.js';

/**
 * Runs the full profiling workflow: select files → profile → write JSON.
 *
 * Orchestrates the complete profile generation process:
 * 1. Reads download manifest from targetDir
 * 2. Selects representative files (one per family)
 * 3. Profiles each file (columns, statistics)
 * 4. Writes profile JSON to outputPath
 *
 * @param targetDir - Directory containing download_manifest.json and CSV files
 * @param outputPath - Path where to save profile JSON (optional, uses default if not provided)
 * @returns Exit code: 0 on success, 1 on failure
 *
 * @example
 * ```typescript
 * // Run profiling
 * const exitCode = await runProfile('/data/kaggle_raw/20240101');
 *
 * // With custom output path
 * const exitCode = await runProfile(
 *   '/data/kaggle_raw/20240101',
 *   '/data/profiles/custom_profile.json'
 * );
 * ```
 */
export async function runProfile(targetDir: string, outputPath?: string): Promise<number> {
  try {
    // Profile the directory
    const profile = await profileDirectory(targetDir);

    if (!profile) {
      console.error(
        `Failed to profile directory: ${targetDir}. Manifest may be missing or invalid.`
      );
      return 1;
    }

    // Determine output path
    let finalOutputPath = outputPath;

    if (!finalOutputPath) {
      // Use default path: data/metadata/data_profile_YYYYMMDD.json
      const dataDir = path.join(targetDir, 'metadata');
      await fs.mkdir(dataDir, { recursive: true });

      const dateStr = profile.dataset_date;
      finalOutputPath = path.join(dataDir, `data_profile_${dateStr}.json`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(finalOutputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write profile to file
    await fs.writeFile(finalOutputPath, JSON.stringify(profile, null, 2));

    console.log(`Profile saved to: ${finalOutputPath}`);
    console.log(
      `Profiled ${profile.profiles.length} file(s) with ${profile.total_patterns} pattern(s)`
    );

    return 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error running profile: ${errorMessage}`);
    return 1;
  }
}

// Export all profile functions
export { detectFileFamily } from './family.js';
export { chooseRepresentativeFiles } from './select.js';
export { summarizeColumn } from './column.js';
export { profileFile } from './file.js';
export { profileDirectory } from './directory.js';
