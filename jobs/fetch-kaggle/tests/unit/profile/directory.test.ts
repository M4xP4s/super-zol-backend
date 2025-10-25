import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { profileDirectory } from '../../../src/lib/profile/directory.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('profileDirectory', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(__dirname, '../../tmp-profile-dir');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should profile multiple CSV files in directory', async () => {
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

    const profile = await profileDirectory(testDir);

    expect(profile).toBeDefined();
    expect(profile?.generated_at).toBeDefined();
    expect(profile?.source_directory).toBe(testDir);
    expect(profile?.profiles.length).toBeGreaterThan(0);
  });

  it('should aggregate profiles from multiple files', async () => {
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
        total_rows: 3,
      },
      files: [
        {
          filename: 'data_file_chain_20240101.csv',
          path: path.join(testDir, 'data_file_chain_20240101.csv'),
          size_bytes: 1024,
          size_mb: 0.001,
          sha256: 'a'.repeat(64),
          row_count: 3,
        },
      ],
    };

    await fs.writeFile(
      path.join(testDir, 'download_manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    const csv = `id,value
1,100
2,200
3,300`;

    await fs.writeFile(path.join(testDir, 'data_file_chain_20240101.csv'), csv);

    const profile = await profileDirectory(testDir);

    expect(profile?.profiles).toHaveLength(1);
    expect(profile?.total_patterns).toBe(1);
  });
});
