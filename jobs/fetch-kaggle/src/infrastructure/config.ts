import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Get the job root directory (jobs/fetch-kaggle)
 * This ensures paths are relative to the job, not the execution directory
 *
 * In ESM, we use import.meta.url to get the current file's URL
 * From src/infrastructure, we go up two levels to reach jobs/fetch-kaggle
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const JOB_ROOT = join(__dirname, '..', '..');

/**
 * Static configuration constants for Kaggle dataset operations
 * These values are immutable and don't change at runtime
 */
export const KAGGLE_CONFIG = {
  datasetId: 'erlichsefi/israeli-supermarkets-2024',
  datasetUrl: 'https://www.kaggle.com/datasets/erlichsefi/israeli-supermarkets-2024',
  dataRoot: join(JOB_ROOT, 'data', 'kaggle_raw'),
  reportsDir: join(JOB_ROOT, 'data', 'reports'),
  metadataDir: join(JOB_ROOT, 'data', 'metadata'),
} as const;

/**
 * Get the Kaggle home directory from environment
 * Validates that HOME environment variable is set
 * @returns The Kaggle directory path (typically ~/.kaggle)
 * @throws Error if HOME environment variable is not set
 */
function getKaggleHomeDir(): string {
  const home = process.env['HOME'];
  if (!home) {
    throw new Error(
      'HOME environment variable is not set. Cannot determine Kaggle directory location.'
    );
  }
  return home;
}

/**
 * Get runtime Kaggle paths
 * These are re-resolved on each call to reflect mid-run environment changes
 * Validates that HOME is set before constructing paths
 */
export function getKagglePaths(): {
  kaggleJson: string;
  kaggleDir: string;
  apiTokenUrl: string;
} {
  const home = getKaggleHomeDir();
  return {
    kaggleJson: `${home}/.kaggle/kaggle.json`,
    kaggleDir: `${home}/.kaggle`,
    apiTokenUrl: 'https://www.kaggle.com/settings/account',
  };
}

/**
 * Static Kaggle paths (for backward compatibility)
 * @deprecated Use getKagglePaths() instead to get runtime-resolved paths
 */
export const KAGGLE_PATHS = {
  kaggleJson: `${process.env['HOME'] || '/root'}/.kaggle/kaggle.json`,
  kaggleDir: `${process.env['HOME'] || '/root'}/.kaggle`,
  apiTokenUrl: 'https://www.kaggle.com/settings/account',
} as const;

/**
 * Type for Kaggle configuration
 */
export type KaggleConfig = typeof KAGGLE_CONFIG;

/**
 * Type for Kaggle paths (matches getKagglePaths return type)
 */
export type KagglePaths = ReturnType<typeof getKagglePaths>;
