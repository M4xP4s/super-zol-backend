import { join } from 'node:path';

/**
 * Get the job root directory (jobs/fetch-kaggle)
 * This ensures paths are relative to the job, not the execution directory
 *
 * __dirname is always available in CommonJS (this project's module system)
 * From src/infrastructure, we go up two levels to reach jobs/fetch-kaggle
 */
const JOB_ROOT = join(__dirname, '..', '..');

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
