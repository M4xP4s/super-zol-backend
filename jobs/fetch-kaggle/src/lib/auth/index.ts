import { checkEnvVars } from './env-check.js';
import { checkKaggleJson } from './kaggle-json.js';
import { verifyKaggleAPI } from './verify-api.js';
import { setupKaggleJson } from './setup.js';

/**
 * Ensure Kaggle auth is properly configured.
 * Tries env vars → kaggle.json → interactive setup.
 */
export async function ensureKaggleAuth(): Promise<boolean> {
  // 1) Env vars
  const env = checkEnvVars();
  if (env) {
    if (await verifyKaggleAPI()) return true;
    // fall through to file-based check
  }

  // 2) kaggle.json
  const file = await checkKaggleJson();
  if (file) {
    if (await verifyKaggleAPI()) return true;
  }

  // 3) Interactive setup
  const configured = await setupKaggleJson();
  if (!configured) return false;
  // Verify once more after setup
  return await verifyKaggleAPI();
}
