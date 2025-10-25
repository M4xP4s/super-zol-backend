/**
 * Directory profiler utilities for schema profiling.
 * Profiles multiple CSV files and aggregates results.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { chooseRepresentativeFiles } from './select.js';
import { profileFile } from './file.js';
import type { DownloadManifest } from '../../core/domain/entities/manifest.js';
import type { DataProfile } from '../../core/domain/entities/profile.js';

/**
 * Profiles all CSV files in a directory and generates a comprehensive data profile.
 *
 * Reads the download manifest, selects representative files per family,
 * profiles each selected file, and aggregates results into a DataProfile.
 *
 * @param targetDir - Directory containing the download_manifest.json and CSV files
 * @returns DataProfile object with profiles for all representative files, or null if manifest is missing
 *
 * @example
 * ```typescript
 * const profile = await profileDirectory('/data/kaggle_raw/20240101');
 * // Returns DataProfile with file profiles, timestamps, and pattern counts
 * ```
 */
export async function profileDirectory(targetDir: string): Promise<DataProfile | null> {
  // Read the manifest
  const manifestPath = path.join(targetDir, 'download_manifest.json');

  let manifest: DownloadManifest;
  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(content) as DownloadManifest;
  } catch {
    return null;
  }

  // Select representative files (one per family)
  const selectedFiles = chooseRepresentativeFiles(manifest.files);

  // Profile each selected file
  const profiles = [];
  for (const fileTarget of selectedFiles) {
    const profile = await profileFile(targetDir, fileTarget);
    profiles.push(profile);
  }

  // Calculate unique patterns
  const patterns = new Set<string>();
  for (const profile of profiles) {
    patterns.add(profile.family);
  }

  return {
    generated_at: new Date().toISOString(),
    source_directory: targetDir,
    dataset_date: manifest.download_info.date,
    total_patterns: patterns.size,
    profiles,
  };
}
