import { describe, it, expect } from 'vitest';
import { detectFileFamily } from '../../../src/lib/profile/family.js';

describe('detectFileFamily', () => {
  it('should detect price_full family from standard filename', () => {
    const [family, chain] = detectFileFamily('price_full_file_shufersal_20240101.csv');
    expect(family).toBe('price_full');
    expect(chain).toBe('shufersal');
  });

  it('should detect promo family', () => {
    const [family, chain] = detectFileFamily('promo_file_rami_20240101.csv');
    expect(family).toBe('promo');
    expect(chain).toBe('rami');
  });

  it('should detect store family', () => {
    const [family, chain] = detectFileFamily('store_file_teva_20240101.csv');
    expect(family).toBe('store');
    expect(chain).toBe('teva');
  });

  it('should handle underscores in chain names', () => {
    const [family, chain] = detectFileFamily('price_full_file_super_zol_20240101.csv');
    expect(family).toBe('price_full');
    expect(chain).toBe('super_zol');
  });

  it('should handle different date formats (8 digits)', () => {
    const [family, chain] = detectFileFamily('price_full_file_shufersal_20250101.csv');
    expect(family).toBe('price_full');
    expect(chain).toBe('shufersal');
  });

  it('should extract file type and chain from multiple underscore parts', () => {
    const [family, chain] = detectFileFamily('price_full_extra_file_chain_name_20240101.csv');
    expect(family).toBe('price_full_extra');
    expect(chain).toBe('chain_name');
  });

  it('should return unknown family for non-matching pattern', () => {
    const [family, chain] = detectFileFamily('random_filename.csv');
    expect(family).toBe('unknown');
    expect(chain).toBe('unknown');
  });

  it('should handle missing date in filename', () => {
    const [family, chain] = detectFileFamily('price_full_file_shufersal.csv');
    expect(family).toBe('unknown');
    expect(chain).toBe('unknown');
  });

  it('should handle all uppercase chains', () => {
    const [family, chain] = detectFileFamily('price_full_file_SHUFERSAL_20240101.csv');
    expect(family).toBe('price_full');
    expect(chain).toBe('SHUFERSAL');
  });
});
