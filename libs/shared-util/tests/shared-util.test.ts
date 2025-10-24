import { describe, it, expect } from 'vitest';
import { sharedUtil } from '../src/lib/shared-util';

describe('shared-util', () => {
  it('should be defined', () => {
    expect(sharedUtil).toBeDefined();
  });

  it('should work correctly', () => {
    const result = sharedUtil();
    expect(result).toBe('shared-util');
  });
});
