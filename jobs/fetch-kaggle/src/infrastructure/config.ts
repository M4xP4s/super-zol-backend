/**
 * Configuration constants for Kaggle dataset operations
 */

export const KAGGLE_CONFIG = {
  datasetId: 'erlichsefi/israeli-supermarkets-2024',
  datasetUrl: 'https://www.kaggle.com/datasets/erlichsefi/israeli-supermarkets-2024',
  dataRoot: './data/kaggle_raw',
  reportsDir: './data/reports',
  metadataDir: './data/metadata',
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
