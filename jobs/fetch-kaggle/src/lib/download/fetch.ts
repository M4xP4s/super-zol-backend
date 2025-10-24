import { execa } from 'execa';

/**
 * Download a dataset via Kaggle CLI into targetDir, unzipping contents.
 * Returns true on success, false on failure.
 */
export async function downloadDataset(
  targetDir: string,
  datasetId: string,
  options?: { timeout?: number }
): Promise<boolean> {
  try {
    await execa('kaggle', ['datasets', 'download', datasetId, '-p', targetDir, '--unzip'], {
      timeout: options?.timeout ?? 10 * 60_000,
    });
    return true;
  } catch {
    return false;
  }
}
