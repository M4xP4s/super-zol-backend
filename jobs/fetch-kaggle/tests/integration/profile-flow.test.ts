import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runProfile } from '../../src/lib/profile/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Profile Flow Integration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(__dirname, '../../tmp-profile-flow');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should run full profiling workflow: analyze → profile → save', async () => {
    // Create manifest
    const manifest = {
      dataset: {
        name: 'Test Dataset',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 2,
        total_size_mb: 0.002,
        total_rows: 7,
      },
      files: [
        {
          filename: 'price_full_file_test_20240101.csv',
          path: path.join(testDir, 'price_full_file_test_20240101.csv'),
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 4,
        },
        {
          filename: 'promo_file_test_20240101.csv',
          path: path.join(testDir, 'promo_file_test_20240101.csv'),
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'b'.repeat(64),
          row_count: 3,
        },
      ],
    };

    // Write manifest
    await fs.writeFile(
      path.join(testDir, 'download_manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Create CSV files
    const csv1 = `name,age
John,30
Jane,28
Bob,35
Alice,32`;

    const csv2 = `product,price
Apple,1.5
Banana,0.75
Orange,2.0`;

    await fs.writeFile(path.join(testDir, 'price_full_file_test_20240101.csv'), csv1);
    await fs.writeFile(path.join(testDir, 'promo_file_test_20240101.csv'), csv2);

    // Create metadata directory
    const metadataDir = path.join(testDir, 'metadata');
    await fs.mkdir(metadataDir, { recursive: true });

    // Run profile workflow
    const exitCode = await runProfile(testDir, path.join(metadataDir, 'test_profile.json'));

    // Verify exit code is 0 (success)
    expect(exitCode).toBe(0);

    // Verify profile file was created
    const profilePath = path.join(metadataDir, 'test_profile.json');
    const profileContent = await fs.readFile(profilePath, 'utf-8');
    const profile = JSON.parse(profileContent);

    expect(profile.generated_at).toBeDefined();
    expect(profile.source_directory).toBe(testDir);
    expect(profile.profiles.length).toBeGreaterThan(0);
  });

  it('should return exit code 1 if manifest is missing', async () => {
    // Don't create manifest - should fail
    const exitCode = await runProfile(testDir);

    expect(exitCode).toBe(1);
  });

  it('should use default output path if not provided', async () => {
    // Create manifest
    const manifest = {
      dataset: {
        name: 'Test',
        kaggle_id: 'test/dataset',
        url: 'https://kaggle.com/datasets/test/dataset',
        download_timestamp: new Date().toISOString(),
      },
      download_info: {
        date: '20240101',
        directory: testDir,
        total_files: 1,
        total_size_mb: 0.001,
        total_rows: 1,
      },
      files: [
        {
          filename: 'data_file_chain_20240101.csv',
          path: path.join(testDir, 'data_file_chain_20240101.csv'),
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 1,
        },
      ],
    };

    await fs.writeFile(
      path.join(testDir, 'download_manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    const csv = `id\n1`;
    await fs.writeFile(path.join(testDir, 'data_file_chain_20240101.csv'), csv);

    // Ensure metadata directory exists
    const metadataDir = path.join(testDir, 'metadata');
    await fs.mkdir(metadataDir, { recursive: true });

    // Run without output path - should use default
    const exitCode = await runProfile(testDir);

    expect(exitCode).toBe(0);

    // Verify profile was saved to default location (metadata directory)
    const files = await fs.readdir(metadataDir);
    expect(files.some((f) => f.startsWith('data_profile_'))).toBe(true);
  });
});
