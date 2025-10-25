import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Get the job root directory (jobs/fetch-kaggle)
 * This ensures paths are relative to the job, not the execution directory
 */
const getJobRoot = (): string => {
  // In ESM: resolve from this file's location
  // In CJS: use __dirname
  if (typeof __dirname !== 'undefined') {
    // CJS: go up from src/infrastructure to job root
    return join(__dirname, '..', '..');
  }
  // ESM fallback (not needed for this project but good practice)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname_esm = dirname(__filename);
  return join(__dirname_esm, '..', '..');
};

const JOB_ROOT = getJobRoot();

/**
 * Configuration constants for Kaggle dataset operations
 */
export const KAGGLE_CONFIG = {
  datasetId: 'erlichsefi/israeli-supermarkets-2024',
  datasetUrl: 'https://www.kaggle.com/datasets/erlichsefi/israeli-supermarkets-2024',
  dataRoot: join(JOB_ROOT, 'data', 'kaggle_raw'),
  reportsDir: join(JOB_ROOT, 'data', 'reports'),
  metadataDir: join(JOB_ROOT, 'data', 'metadata'),
} as const;

export const KAGGLE_PATHS = {
  kaggleJson: `${process.env.HOME}/.kaggle/kaggle.json`,
  kaggleDir: `${process.env.HOME}/.kaggle`,
  apiTokenUrl: 'https://www.kaggle.com/settings/account',
} as const;

/**
 * Type for Kaggle configuration
 */
export type KaggleConfig = typeof KAGGLE_CONFIG;

/**
 * Type for Kaggle paths
 */
export type KagglePaths = typeof KAGGLE_PATHS;
