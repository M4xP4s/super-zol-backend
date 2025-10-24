import { promises as fs } from 'node:fs';
import path from 'node:path';
import { KAGGLE_CONFIG } from '../../infrastructure/config';
import type { DownloadManifest } from '../../core/domain/entities/manifest';
import type { ProcessedFilesResult } from './process';

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
