/**
 * Value Object representing Kaggle API credentials
 * Immutable and self-validating
 */
export class KaggleCredentials {
  private constructor(
    public readonly username: string,
    public readonly apiKey: string
  ) {}

  /**
   * Factory method to create validated Kaggle credentials
   * @param username - Kaggle username
   * @param apiKey - Kaggle API key
   * @throws Error if validation fails
   */
  static create(username: string, apiKey: string): KaggleCredentials {
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    if (!apiKey || apiKey.length < 20) {
      throw new Error('Invalid API key format - must be at least 20 characters');
    }
    return new KaggleCredentials(username.trim(), apiKey);
  }

  /**
   * Convert to JSON format for kaggle.json file
   */
  toJSON() {
    return {
      username: this.username,
      key: this.apiKey,
    };
  }

  /**
   * Compare equality with another KaggleCredentials
   */
  equals(other: KaggleCredentials): boolean {
    return this.username === other.username && this.apiKey === other.apiKey;
  }
}
