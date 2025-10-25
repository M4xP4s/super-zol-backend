import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DownloadManifest } from '../../core/domain/entities/manifest.js';
import type { InventoryAnalysis } from '../../core/domain/entities/inventory.js';
import { extractPatternInfo } from './pattern.js';

/**
 * Analyzes a directory containing a download manifest.
 *
 * Loads the manifest, groups files by pattern, and aggregates statistics
 * by chain and file type.
 *
 * @param targetDir - Directory containing the download_manifest.json file
 * @returns InventoryAnalysis object or null if manifest is missing/invalid
 *
 * @example
 * ```typescript
 * const analysis = await analyzeDirectory('./data/kaggle_raw/20240101');
 * if (analysis) {
 *   console.log(`Total files: ${analysis.summary.total_files}`);
 *   console.log(`Chains: ${Object.keys(analysis.chains).join(', ')}`);
 * }
 * ```
 */
export async function analyzeDirectory(targetDir: string): Promise<InventoryAnalysis | null> {
  const manifestPath = join(targetDir, 'download_manifest.json');

  try {
    // Load and parse manifest
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest: DownloadManifest = JSON.parse(manifestContent);

    // Initialize result structure
    const patterns: Record<string, InventoryAnalysis['files']> = {};
    const chains: Record<string, number> = {};
    const fileTypes: Record<string, number> = {};

    let totalSizeMb = 0;
    let totalRows = 0;

    // Process each file
    for (const file of manifest.files) {
      // Extract pattern information
      const patternInfo = extractPatternInfo(file.filename);

      // Group by pattern
      const existingPattern = patterns[patternInfo.pattern];
      if (existingPattern) {
        existingPattern.push(file);
      } else {
        patterns[patternInfo.pattern] = [file];
      }

      // Count by chain
      chains[patternInfo.chain] = (chains[patternInfo.chain] || 0) + 1;

      // Count by file type
      fileTypes[patternInfo.fileType] = (fileTypes[patternInfo.fileType] || 0) + 1;

      // Aggregate totals
      totalSizeMb += file.size_mb;
      totalRows += file.row_count ?? 0; // Handle null row_count
    }

    return {
      files: manifest.files,
      patterns,
      chains,
      fileTypes,
      summary: {
        total_files: manifest.files.length,
        total_size_mb: totalSizeMb,
        total_rows: totalRows,
      },
    };
  } catch (error) {
    // Return null if manifest doesn't exist or is invalid
    // Log error details for debugging
    if (process.env.DEBUG) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to analyze directory ${targetDir}: ${errorMessage}`);
    }
    return null;
  }
}
