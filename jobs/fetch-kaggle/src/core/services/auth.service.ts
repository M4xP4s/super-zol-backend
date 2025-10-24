/**
 * Authentication Service (Core Business Logic)
 * Implements the authentication use case using Hexagonal Architecture
 */

import {
  IAuthenticateKaggle,
  AuthenticateKaggleRequest,
  AuthenticateKaggleResponse,
} from '../ports/inbound/authenticate-kaggle.port';
import { IKaggleAPI, ICredentialStore } from '../ports/outbound/kaggle-api.port';

export class AuthService implements IAuthenticateKaggle {
  constructor(
    private readonly kaggleAPI: IKaggleAPI,
    private readonly envStore: ICredentialStore,
    private readonly fileStore: ICredentialStore
  ) {}

  async execute(request: AuthenticateKaggleRequest): Promise<AuthenticateKaggleResponse> {
    // 1. Try environment variables first (fastest, no file I/O)
    if (!request.forceInteractive) {
      const envCreds = await this.envStore.load();
      if (envCreds) {
        const isValid = await this.kaggleAPI.verify(envCreds);
        if (isValid) {
          return { success: true, source: 'env' };
        }
      }
    }

    // 2. Try kaggle.json file
    if (!request.forceInteractive) {
      const fileCreds = await this.fileStore.load();
      if (fileCreds) {
        const isValid = await this.kaggleAPI.verify(fileCreds);
        if (isValid) {
          return { success: true, source: 'file' };
        }
      }
    }

    // 3. No valid credentials found
    return {
      success: false,
      source: null,
      error:
        'No valid Kaggle credentials found. Set KAGGLE_USERNAME/KAGGLE_KEY or configure ~/.kaggle/kaggle.json',
    };
  }
}
