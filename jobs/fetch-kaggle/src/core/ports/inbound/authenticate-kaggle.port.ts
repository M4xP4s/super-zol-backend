/**
 * PRIMARY PORT (Inbound) - Defines what our application can do
 * This is called by CLI, tests, or other primary adapters
 */

export interface AuthenticateKaggleRequest {
  forceInteractive?: boolean;
}

export interface AuthenticateKaggleResponse {
  success: boolean;
  source: 'env' | 'file' | 'interactive' | null;
  error?: string;
}

/**
 * Port for Kaggle authentication use case
 */
export interface IAuthenticateKaggle {
  execute(request: AuthenticateKaggleRequest): Promise<AuthenticateKaggleResponse>;
}
