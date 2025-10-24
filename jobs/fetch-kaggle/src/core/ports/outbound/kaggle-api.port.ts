/**
 * SECONDARY PORT (Outbound) - Defines what our application needs from external world
 * These are implemented by secondary adapters
 */

import { KaggleCredentials } from '../../domain/value-objects/kaggle-credentials';

/**
 * Port for Kaggle API operations
 */
export interface IKaggleAPI {
  /**
   * Verify if credentials are valid by making a test API call
   */
  verify(credentials: KaggleCredentials): Promise<boolean>;

  /**
   * Download a dataset to the specified directory
   */
  downloadDataset(datasetId: string, targetDir: string): Promise<void>;
}

/**
 * Port for credential storage (environment variables or kaggle.json)
 */
export interface ICredentialStore {
  /**
   * Load credentials from the store
   * Returns null if no credentials found
   */
  load(): Promise<KaggleCredentials | null>;

  /**
   * Save credentials to the store
   */
  save(credentials: KaggleCredentials): Promise<void>;

  /**
   * Check if credentials exist in this store
   */
  exists(): Promise<boolean>;
}
