/**
 * SECONDARY ADAPTER - Mock Kaggle CLI for testing
 * Implements IKaggleAPI port without external dependencies
 */

import { IKaggleAPI } from '../../core/ports/outbound/kaggle-api.port';
import { KaggleCredentials } from '../../core/domain/value-objects/kaggle-credentials';

export class MockKaggleCLIAdapter implements IKaggleAPI {
  constructor(private shouldSucceed = true) {}

  async verify(_credentials: KaggleCredentials): Promise<boolean> {
    return this.shouldSucceed;
  }

  async downloadDataset(_datasetId: string, _targetDir: string): Promise<void> {
    if (!this.shouldSucceed) {
      throw new Error('Mock download failed');
    }
  }

  /**
   * Configure whether API calls should succeed or fail (for testing)
   */
  setSuccess(shouldSucceed: boolean): void {
    this.shouldSucceed = shouldSucceed;
  }
}
