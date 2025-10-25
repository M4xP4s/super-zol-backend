import { execa } from 'execa';

/**
 * Verify Kaggle CLI works by listing a tiny set of datasets.
 * Returns true on success, false on any failure/timeout/missing CLI.
 */
export async function verifyKaggleAPI(timeout = 10_000): Promise<boolean> {
  try {
    await execa('kaggle', ['datasets', 'list', '--max-size', '1'], { timeout });
    return true;
  } catch {
    return false;
  }
}
