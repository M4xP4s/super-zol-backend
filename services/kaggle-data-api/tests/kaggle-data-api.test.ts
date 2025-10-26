import { describe, it, expect } from 'vitest';

describe('Service', () => {
  it('should be importable', async () => {
    const app = await import('../src/app/app.js');
    expect(app).toBeDefined();
    expect(app.app).toBeDefined();
    expect(app.build).toBeDefined();
  });
});
