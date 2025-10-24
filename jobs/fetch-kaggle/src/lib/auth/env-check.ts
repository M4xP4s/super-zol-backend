export interface KaggleEnvCreds {
  username: string;
  key: string;
}

/**
 * Detect Kaggle credentials from environment variables.
 * Returns null when either variable is missing/empty.
 */
export function checkEnvVars(): KaggleEnvCreds | null {
  const username = process.env.KAGGLE_USERNAME?.trim();
  const key = process.env.KAGGLE_KEY?.trim();
  if (!username || !key) return null;
  return { username, key };
}
