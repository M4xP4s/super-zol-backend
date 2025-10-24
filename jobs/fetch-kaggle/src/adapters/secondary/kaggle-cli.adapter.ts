/**
 * SECONDARY ADAPTER - Real Kaggle CLI implementation
 * Implements IKaggleAPI port using the actual Kaggle CLI
 */

import { execa } from 'execa';
import { IKaggleAPI } from '../../core/ports/outbound/kaggle-api.port';
import { KaggleCredentials } from '../../core/domain/value-objects/kaggle-credentials';

export class KaggleCLIAdapter implements IKaggleAPI {
  async verify(credentials: KaggleCredentials): Promise<boolean> {
    try {
      await execa('kaggle', ['datasets', 'list', '--max-size', '1'], {
        env: {
          KAGGLE_USERNAME: credentials.username,
          KAGGLE_KEY: credentials.apiKey,
        },
        timeout: 10000, // 10 seconds
      });
      return true;
    } catch {
      return false;
    }
  }

  async downloadDataset(datasetId: string, targetDir: string): Promise<void> {
    await execa('kaggle', ['datasets', 'download', datasetId, '-p', targetDir, '--unzip'], {
      timeout: 600000, // 10 minutes
    });
  }
}
