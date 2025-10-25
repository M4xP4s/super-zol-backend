import { promises as fs } from 'node:fs';
import path from 'node:path';
import { format } from 'date-fns';
import { KAGGLE_CONFIG } from '../../infrastructure/config.js';
import { ensureDir } from '../utils/fs.js';
import { downloadDataset } from './fetch.js';
import { processFiles } from './process.js';
import { createManifest } from './manifest.js';
import { validateCompletion } from './validate.js';

export async function runDownload(options?: {
  datasetId?: string;
  dryRun?: boolean;
}): Promise<number> {
  const datasetId = options?.datasetId ?? KAGGLE_CONFIG.datasetId;
  const dateStr = format(new Date(), 'yyyyMMdd');
  const targetDir = path.join(KAGGLE_CONFIG.dataRoot, dateStr);

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
export * from './fetch.js';
export * from './process.js';
export * from './manifest.js';
export * from './validate.js';
