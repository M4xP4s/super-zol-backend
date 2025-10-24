import { promises as fs } from 'node:fs';
import path from 'node:path';
import { format } from 'date-fns';
import { KAGGLE_CONFIG } from '../../infrastructure/config';
import { ensureDir } from '../utils/fs';
import { downloadDataset } from './fetch';
import { processFiles } from './process';
import { createManifest } from './manifest';
import { validateCompletion } from './validate';

export async function runDownload(options?: {
  datasetId?: string;
  dryRun?: boolean;
}): Promise<number> {
  const datasetId = options?.datasetId ?? KAGGLE_CONFIG.datasetId;
  const dateStr = format(new Date(), 'yyyyMMdd');
  const targetDir = path
    .join('jobs/fetch-kaggle', KAGGLE_CONFIG.dataRoot, dateStr)
    .replace('jobs/fetch-kaggle/', 'jobs/fetch-kaggle/');

  await ensureDir(targetDir);

  // If dry-run, create a small sample CSV to simulate a download
  if (options?.dryRun) {
    const sampleCsv = path.join(targetDir, 'sample.csv');
    try {
      await fs.access(sampleCsv);
    } catch {
      await fs.writeFile(sampleCsv, 'h\na\n', 'utf8');
    }
  } else {
    const ok = await downloadDataset(targetDir, datasetId, { timeout: 10 * 60_000 });
    if (!ok) return 1;
  }

  const processed = await processFiles(targetDir);
  const ts = new Date().toISOString();
  await createManifest(targetDir, processed, ts, datasetId);

  const result = await validateCompletion(targetDir);
  return result.passed ? 0 : 1;
}

// Re-exports
export * from './fetch';
export * from './process';
export * from './manifest';
export * from './validate';
