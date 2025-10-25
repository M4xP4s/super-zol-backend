/**
 * Representative file selection for schema profiling.
 * Selects one file per family based on row count preferences.
 */

import { detectFileFamily } from './family.js';
import type { FileMetadata } from '../../core/domain/entities/manifest.js';
import type { FileTarget } from '../../core/domain/entities/inventory.js';

/**
 * Chooses representative files for profiling, selecting one per family.
 *
 * Partitions files into families, then selects the file with the highest row count
 * from each family. Skips files with null row counts.
 *
 * @param files - Array of file metadata to select from
 * @returns Array of FileTarget objects representing one file per family
 *
 * @example
 * ```typescript
 * const files = [
 *   { filename: 'price_full_file_shufersal_20240101.csv', row_count: 100 },
 *   { filename: 'price_full_file_shufersal_20240102.csv', row_count: 200 },
 *   { filename: 'promo_file_shufersal_20240101.csv', row_count: 50 }
 * ];
 *
 * const selected = chooseRepresentativeFiles(files);
 * // Returns 2 FileTargets (one price_full with 200 rows, one promo with 50 rows)
 * ```
 */
export function chooseRepresentativeFiles(files: FileMetadata[]): FileTarget[] {
  // Group files by family
  const familyMap = new Map<string, FileMetadata[]>();

  for (const file of files) {
    const [family] = detectFileFamily(file.filename);

    // Create a unique key for each family
    const key = family;

    if (!familyMap.has(key)) {
      familyMap.set(key, []);
    }

    // Add file only if it has a valid row count
    if (file.row_count !== null) {
      const familyFiles = familyMap.get(key);
      if (familyFiles) {
        familyFiles.push(file);
      }
    }
  }

  // For each family, select the file with the highest row count
  const selected: FileTarget[] = [];

  for (const [family, familyFiles] of familyMap.entries()) {
    if (familyFiles.length === 0) {
      continue;
    }

    // Find file with max row count (guaranteed to have at least one file)
    let bestFile = familyFiles[0] as FileMetadata;
    let maxRows = bestFile.row_count ?? 0;

    for (const file of familyFiles) {
      const rows = file.row_count ?? 0;
      if (rows > maxRows) {
        maxRows = rows;
        bestFile = file;
      }
    }

    // Get chain from the selected file
    const [, chain] = detectFileFamily(bestFile.filename);

    selected.push({
      filename: bestFile.filename,
      family,
      chain,
      path: bestFile.path,
      rowCount: bestFile.row_count ?? 0,
    });
  }

  return selected;
}
