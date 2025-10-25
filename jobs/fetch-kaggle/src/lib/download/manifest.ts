import { promises as fs } from 'node:fs';
import path from 'node:path';
import { KAGGLE_CONFIG } from '../../infrastructure/config.js';
import type { DownloadManifest } from '../../core/domain/entities/manifest.js';
import type { ProcessedFilesResult } from './process.js';

/**
 * Create and persist a `download_manifest.json` in the target directory.
 *
 * The manifest summarizes dataset metadata and per-file stats so that inventory
 * and profiling steps can operate deterministically.
 *
 * @param targetDir - Directory where the manifest will be written
 * @param filesData - Output of `processFiles` for the directory
 * @param downloadTime - ISO timestamp for when the dataset was downloaded
 * @param datasetId - Kaggle dataset identifier ("user/dataset")
 * @returns Absolute path to the saved manifest file
 */
export async function createManifest(
  targetDir: string,
  filesData: ProcessedFilesResult,
  downloadTime: string,
  datasetId: string
): Promise<string> {
  const parts = datasetId.split('/');
  const dsName = parts.length > 1 ? (parts[parts.length - 1] as string) : (parts[0] as string);
  const manifest: DownloadManifest = {
    dataset: {
      name: dsName,
      kaggle_id: datasetId,
      url: `${KAGGLE_CONFIG.datasetUrl}`,
      download_timestamp: downloadTime,
    },
    download_info: {
      date: path.basename(targetDir),
      directory: targetDir,
      total_files: filesData.totalFiles,
      total_size_mb: filesData.totalSizeMB,
      total_rows: filesData.totalRows,
    },
    files: filesData.files,
  };

  const outPath = path.join(targetDir, 'download_manifest.json');
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  return outPath;
}
