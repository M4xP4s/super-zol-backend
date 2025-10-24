import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface ValidationResult {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean }>;
}

export async function validateCompletion(targetDir: string): Promise<ValidationResult> {
  const checks: ValidationResult['checks'] = [];
  const manifestPath = path.join(targetDir, 'download_manifest.json');

  const manifestExists = await fs
    .access(manifestPath)
    .then(() => true)
    .catch(() => false);
  checks.push({ name: 'manifest_exists', passed: manifestExists });

  if (!manifestExists) return { passed: false, checks };

  const raw = await fs.readFile(manifestPath, 'utf8');
  const json = JSON.parse(raw) as { files?: Array<{ sha256?: string }>; download_info?: unknown };

  const hasFiles = Array.isArray(json.files) && json.files.length > 0;
  checks.push({ name: 'files_listed', passed: hasFiles });

  const allChecksumsPresent = hasFiles
    ? (json.files as Array<{ sha256?: string }>).every(
        (f) => typeof f.sha256 === 'string' && (f.sha256 as string).length === 64
      )
    : false;
  checks.push({ name: 'checksums_present', passed: allChecksumsPresent });

  const passed = checks.every((c) => c.passed);
  return { passed, checks };
}
