/**
 * TDD Tests for AuthService (Hexagonal Architecture Demo)
 *
 * This demonstrates:
 * - Testing core business logic without touching external systems
 * - Using mock adapters to isolate the service
 * - Testing through ports (interfaces)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../../src/core/services/auth.service.js';
import { KaggleCredentials } from '../../../src/core/domain/value-objects/kaggle-credentials.js';
import { IKaggleAPI, ICredentialStore } from '../../../src/core/ports/outbound/kaggle-api.port.js';

// Mock implementations of ports
class MockKaggleAPI implements IKaggleAPI {
  constructor(private shouldSucceed = true) {}

  async verify(_credentials: KaggleCredentials): Promise<boolean> {
    return this.shouldSucceed;
  }

  async downloadDataset(_datasetId: string, _targetDir: string): Promise<void> {
    if (!this.shouldSucceed) {
      throw new Error('Mock download failed');
    }
  }

  setSuccess(shouldSucceed: boolean): void {
    this.shouldSucceed = shouldSucceed;
  }
}

class MockCredentialStore implements ICredentialStore {
  constructor(private credentials: KaggleCredentials | null) {}

  async load(): Promise<KaggleCredentials | null> {
    return this.credentials;
  }

  async save(_credentials: KaggleCredentials): Promise<void> {
    // Mock implementation
  }

  async exists(): Promise<boolean> {
    return this.credentials !== null;
  }

  setCredentials(creds: KaggleCredentials | null): void {
    this.credentials = creds;
  }
}

describe('AuthService (Hexagonal Architecture)', () => {
  let mockAPI: MockKaggleAPI;
  let mockEnvStore: MockCredentialStore;
  let mockFileStore: MockCredentialStore;
  let authService: AuthService;

  beforeEach(() => {
    // Fresh mocks for each test
    mockAPI = new MockKaggleAPI(true);
    mockEnvStore = new MockCredentialStore(null);
    mockFileStore = new MockCredentialStore(null);
    authService = new AuthService(mockAPI, mockEnvStore, mockFileStore);
  });

  describe('Authentication Flow', () => {
    it('should authenticate successfully with environment credentials', async () => {
      // Arrange
      const envCreds = KaggleCredentials.create('envuser', 'env-key-1234567890123456789012345');
      mockEnvStore.setCredentials(envCreds);
      mockAPI.setSuccess(true);

      // Act
      const result = await authService.execute({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.source).toBe('env');
      expect(result.error).toBeUndefined();
    });

    it('should fall back to file credentials when env credentials fail', async () => {
      // Arrange
      const envCreds = KaggleCredentials.create('envuser', 'bad-key-1234567890123456789012345');
      const fileCreds = KaggleCredentials.create('fileuser', 'file-key-123456789012345678901234');

      mockEnvStore.setCredentials(envCreds);
      mockFileStore.setCredentials(fileCreds);

      // Simulate env credentials invalid, file credentials valid
      let callCount = 0;
      const originalVerify = mockAPI.verify.bind(mockAPI);
      mockAPI.verify = async (creds: KaggleCredentials) => {
        callCount++;
        if (callCount === 1) return false; // First call (env) fails
        return originalVerify(creds); // Second call (file) succeeds
      };

      // Act
      const result = await authService.execute({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.source).toBe('file');
    });

    it('should fail when no credentials are available', async () => {
      // Arrange
      mockEnvStore.setCredentials(null);
      mockFileStore.setCredentials(null);

      // Act
      const result = await authService.execute({});

      // Assert
      expect(result.success).toBe(false);
      expect(result.source).toBeNull();
      expect(result.error).toContain('No valid Kaggle credentials found');
    });

    it('should fail when credentials exist but are invalid', async () => {
      // Arrange
      const badCreds = KaggleCredentials.create('baduser', 'invalid-key-12345678901234567890');
      mockEnvStore.setCredentials(badCreds);
      mockAPI.setSuccess(false); // API returns invalid

      // Act
      const result = await authService.execute({});

      // Assert
      expect(result.success).toBe(false);
      expect(result.source).toBeNull();
    });

    it('should skip env check when forceInteractive is true', async () => {
      // Arrange
      const envCreds = KaggleCredentials.create('envuser', 'env-key-1234567890123456789012345');
      mockEnvStore.setCredentials(envCreds);
      mockFileStore.setCredentials(null);

      // Act
      const result = await authService.execute({ forceInteractive: true });

      // Assert
      // Should skip both env and file, since forceInteractive=true
      expect(result.success).toBe(false);
      expect(result.source).toBeNull();
    });
  });

  describe('Credential Priority', () => {
    it('should prefer environment variables over file', async () => {
      // Arrange
      const envCreds = KaggleCredentials.create('envuser', 'env-key-1234567890123456789012345');
      const fileCreds = KaggleCredentials.create('fileuser', 'file-key-123456789012345678901234');

      mockEnvStore.setCredentials(envCreds);
      mockFileStore.setCredentials(fileCreds);
      mockAPI.setSuccess(true);

      // Act
      const result = await authService.execute({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.source).toBe('env'); // Should use env first
    });
  });
});
