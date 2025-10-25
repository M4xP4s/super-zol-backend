import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { profileFile } from '../../../src/lib/profile/file.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('profileFile', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    testDir = path.join(__dirname, '../../tmp-profile-file');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should profile CSV and return column stats', async () => {
    // Create a test CSV file
    const csvContent = `name,age,city,salary
John,30,New York,75000
Jane,28,San Francisco,85000
Bob,35,Chicago,70000
Alice,32,Boston,90000`;

    const csvPath = path.join(testDir, 'price_full_file_test_20240101.csv');
    await fs.writeFile(csvPath, csvContent);

    const profile = await profileFile(testDir, {
      filename: 'price_full_file_test_20240101.csv',
      family: 'price_full',
      chain: 'test',
      path: csvPath,
      rowCount: 4,
    });

    expect(profile.family).toBe('price_full');
    expect(profile.chain).toBe('test');
    expect(profile.filename).toBe('price_full_file_test_20240101.csv');
    expect(profile.row_count).toBe(4);
    expect(profile.columns.length).toBe(4); // 4 columns: name, age, city, salary

    // Check that all columns are present
    const columnNames = profile.columns.map((c) => c.name);
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('age');
    expect(columnNames).toContain('city');
    expect(columnNames).toContain('salary');
  });

  it('should detect column types correctly', async () => {
    const csvContent = `product,price,quantity,date
Apple,1.5,100,2024-01-01
Banana,0.75,200,2024-01-02
Orange,2.0,150,2024-01-03`;

    const csvPath = path.join(testDir, 'test_file_chain_20240101.csv');
    await fs.writeFile(csvPath, csvContent);

    const profile = await profileFile(testDir, {
      filename: 'test_file_chain_20240101.csv',
      family: 'test',
      chain: 'chain',
      path: csvPath,
      rowCount: 3,
    });

    const priceColumn = profile.columns.find((c) => c.name === 'price');
    expect(priceColumn?.dtype).toBe('numeric');

    const productColumn = profile.columns.find((c) => c.name === 'product');
    expect(productColumn?.dtype).toBe('string');
  });

  it('should handle null values in CSV', async () => {
    const csvContent = `id,name,email
1,John,john@example.com
2,,jane@example.com
3,Bob,`;

    const csvPath = path.join(testDir, 'data_file_source_20240101.csv');
    await fs.writeFile(csvPath, csvContent);

    const profile = await profileFile(testDir, {
      filename: 'data_file_source_20240101.csv',
      family: 'data',
      chain: 'source',
      path: csvPath,
      rowCount: 3,
    });

    const emailColumn = profile.columns.find((c) => c.name === 'email');
    expect(emailColumn?.null_count).toBeGreaterThanOrEqual(1);
    expect(emailColumn?.null_rate).toBeGreaterThan(0);
  });

  it('should extract sample values from columns', async () => {
    const csvContent = `letter
A
B
C
D
E`;

    const csvPath = path.join(testDir, 'letters_file_test_20240101.csv');
    await fs.writeFile(csvPath, csvContent);

    const profile = await profileFile(testDir, {
      filename: 'letters_file_test_20240101.csv',
      family: 'letters',
      chain: 'test',
      path: csvPath,
      rowCount: 5,
    });

    const letterColumn = profile.columns.find((c) => c.name === 'letter');
    expect(letterColumn?.sample_values.length).toBeLessThanOrEqual(3);
  });
});
