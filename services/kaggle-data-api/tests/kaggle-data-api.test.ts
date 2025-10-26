import { describe, it, expect } from 'vitest';

describe('Kaggle Data API Service', () => {
  describe('App Module', () => {
    it('should be importable', async () => {
      const app = await import('../src/app/app.js');
      expect(app).toBeDefined();
      expect(app.app).toBeDefined();
      expect(app.build).toBeDefined();
    });
  });

  describe('Main Entry Point', () => {
    it('should have main.ts file', async () => {
      // main.ts is the entry point and starts the server
      // We verify it exists by checking the module structure
      const fs = await import('fs/promises');
      const path = await import('path');
      const mainPath = path.resolve(process.cwd(), 'services/kaggle-data-api/src/main.ts');
      const exists = await fs
        .access(mainPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Root Route', () => {
    it('should be importable', async () => {
      const root = await import('../src/app/routes/root.js');
      expect(root).toBeDefined();
      expect(typeof root.default).toBe('function');
    });
  });

  describe('Datasets Route', () => {
    it('should be importable', async () => {
      const datasets = await import('../src/app/routes/datasets.js');
      expect(datasets).toBeDefined();
      expect(typeof datasets.default).toBe('function');
    });
  });

  describe('Database Module', () => {
    it('should export getDatabaseUrl function', async () => {
      const db = await import('../src/infrastructure/database.js');
      expect(typeof db.getDatabaseUrl).toBe('function');
    });

    it('should export getPool function', async () => {
      const db = await import('../src/infrastructure/database.js');
      expect(typeof db.getPool).toBe('function');
    });

    it('should export query function', async () => {
      const db = await import('../src/infrastructure/database.js');
      expect(typeof db.query).toBe('function');
    });

    it('should export getClient function', async () => {
      const db = await import('../src/infrastructure/database.js');
      expect(typeof db.getClient).toBe('function');
    });

    it('should export closePool function', async () => {
      const db = await import('../src/infrastructure/database.js');
      expect(typeof db.closePool).toBe('function');
    });

    it('getDatabaseUrl should construct connection string from DATABASE_URL', async () => {
      const db = await import('../src/infrastructure/database.js');
      const originalEnv = { ...process.env };

      try {
        process.env['DATABASE_URL'] = 'postgresql://user:pass@host:5432/db';
        expect(db.getDatabaseUrl()).toBe('postgresql://user:pass@host:5432/db');
      } finally {
        process.env = originalEnv;
      }
    });

    it('getDatabaseUrl should construct connection string from individual env vars', async () => {
      const db = await import('../src/infrastructure/database.js');
      const originalEnv = { ...process.env };

      try {
        delete process.env['DATABASE_URL'];
        process.env['DB_HOST'] = 'testhost';
        process.env['DB_PORT'] = '9999';
        process.env['DB_USER'] = 'testuser';
        process.env['DB_PASSWORD'] = 'testpass';
        process.env['DB_NAME'] = 'testdb';

        const url = db.getDatabaseUrl();
        expect(url).toContain('testhost');
        expect(url).toContain('9999');
        expect(url).toContain('testuser');
        expect(url).toContain('testpass');
        expect(url).toContain('testdb');
      } finally {
        process.env = originalEnv;
      }
    });

    it('getDatabaseUrl should use default values when env vars are not set', async () => {
      const db = await import('../src/infrastructure/database.js');
      const originalEnv = { ...process.env };

      try {
        // Clear all database env vars
        delete process.env['DATABASE_URL'];
        delete process.env['DB_HOST'];
        delete process.env['DB_PORT'];
        delete process.env['DB_USER'];
        delete process.env['DB_PASSWORD'];
        delete process.env['DB_NAME'];

        const url = db.getDatabaseUrl();
        expect(url).toContain('localhost');
        expect(url).toContain('5432');
        expect(url).toContain('postgres');
      } finally {
        process.env = originalEnv;
      }
    });

    it('getDatabaseUrl should validate DATABASE_URL format', async () => {
      const db = await import('../src/infrastructure/database.js');
      const originalEnv = { ...process.env };

      try {
        process.env['DATABASE_URL'] = 'mysql://user:pass@host/db';
        expect(() => db.getDatabaseUrl()).toThrow(
          'Invalid DATABASE_URL: Must start with postgresql:// or postgres://'
        );
      } finally {
        process.env = originalEnv;
      }
    });

    it('getDatabaseUrl should validate port number', async () => {
      const db = await import('../src/infrastructure/database.js');
      const originalEnv = { ...process.env };

      try {
        delete process.env['DATABASE_URL'];

        // Invalid port
        process.env['DB_PORT'] = 'not-a-number';
        expect(() => db.getDatabaseUrl()).toThrow('Invalid DB_PORT');

        // Port out of range (too high)
        process.env['DB_PORT'] = '99999';
        expect(() => db.getDatabaseUrl()).toThrow('Invalid DB_PORT');

        // Port out of range (too low)
        process.env['DB_PORT'] = '0';
        expect(() => db.getDatabaseUrl()).toThrow('Invalid DB_PORT');

        // Valid port
        process.env['DB_PORT'] = '5432';
        expect(() => db.getDatabaseUrl()).not.toThrow();
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('Sensible Plugin', () => {
    it('should be importable', async () => {
      const sensible = await import('../src/app/plugins/sensible.js');
      expect(sensible).toBeDefined();
      expect(typeof sensible.default).toBe('function');
    });
  });

  describe('Service Architecture', () => {
    it('should have database infrastructure', async () => {
      const db = await import('../src/infrastructure/database.js');
      expect(db).toBeDefined();
      const keys = Object.keys(db);
      expect(keys).toContain('getDatabaseUrl');
      expect(keys).toContain('getPool');
      expect(keys).toContain('query');
      expect(keys).toContain('getClient');
      expect(keys).toContain('closePool');
    });

    it('should have defined routes', async () => {
      const root = await import('../src/app/routes/root.js');
      const datasets = await import('../src/app/routes/datasets.js');
      expect(root.default).toBeDefined();
      expect(datasets.default).toBeDefined();
    });
  });
});
