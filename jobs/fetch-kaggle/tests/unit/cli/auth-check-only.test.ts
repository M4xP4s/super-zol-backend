import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const saveHome = process.env.HOME;
const saveUsername = process.env.KAGGLE_USERNAME;
const saveKey = process.env.KAGGLE_KEY;

// Mock execa to prevent actual Kaggle API calls
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: 'success', stderr: '', exitCode: 0 }),
}));

describe('auth command --check-only', () => {
  let tmpHome: string;
  let exitCode: number | null = null;
  let consoleOutput: string[] = [];

  beforeEach(async () => {
    vi.resetModules();
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'fk-cli-auth-'));
    process.env.HOME = tmpHome;
    delete process.env.KAGGLE_USERNAME;
    delete process.env.KAGGLE_KEY;

    // Capture console output
    consoleOutput = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      consoleOutput.push(args.join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      consoleOutput.push(args.join(' '));
    });

    // Mock process.exit to capture exit code
    exitCode = null;
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      exitCode = typeof code === 'number' ? code : code ? 1 : 0;
      return undefined as never;
    });
  });

  afterEach(async () => {
    process.env.HOME = saveHome;
    process.env.KAGGLE_USERNAME = saveUsername;
    process.env.KAGGLE_KEY = saveKey;
    vi.restoreAllMocks();
    try {
      await fs.rm(tmpHome, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('should succeed when env vars are present', async () => {
    process.env.KAGGLE_USERNAME = 'testuser';
    process.env.KAGGLE_KEY = 'testkey123';

    const authModule = await import('../../../src/cli/commands/auth.js');
    const command = authModule.default();

    // Simulate: fetch-kaggle auth --check-only
    await command.parseAsync(['node', 'cli', 'auth', '--check-only']);

    expect(exitCode).toBe(0);
    expect(consoleOutput.join('\n')).toContain('Found credentials in environment variables');
    expect(consoleOutput.join('\n')).toContain('✓ Authentication successful!');
  });

  it('should succeed when kaggle.json exists', async () => {
    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');
    await fs.writeFile(file, JSON.stringify({ username: 'fileuser', key: 'k'.repeat(40) }), 'utf8');
    await fs.chmod(file, 0o600);

    const authModule = await import('../../../src/cli/commands/auth.js');
    const command = authModule.default();

    await command.parseAsync(['node', 'cli', 'auth', '--check-only']);

    expect(exitCode).toBe(0);
    expect(consoleOutput.join('\n')).toContain('Found credentials in kaggle.json');
    expect(consoleOutput.join('\n')).toContain('✓ Authentication successful!');
  });

  it('should fail with exit code 1 when no credentials found', async () => {
    const authModule = await import('../../../src/cli/commands/auth.js');
    const command = authModule.default();

    await command.parseAsync(['node', 'cli', 'auth', '--check-only']);

    expect(exitCode).toBe(1);
    expect(consoleOutput.join('\n')).toContain('No valid credentials found');
    expect(consoleOutput.join('\n')).toContain('Run without --check-only to set up interactively');
  });

  it('should NOT invoke interactive setup when missing creds', async () => {
    // Import auth module to spy on it
    const authIndex = await import('../../../src/lib/auth/index.js');
    const ensureAuthSpy = vi.spyOn(authIndex, 'ensureKaggleAuth');

    const authModule = await import('../../../src/cli/commands/auth.js');
    const command = authModule.default();

    await command.parseAsync(['node', 'cli', 'auth', '--check-only']);

    // ensureKaggleAuth should NOT have been called in check-only mode
    expect(ensureAuthSpy).not.toHaveBeenCalled();
    expect(exitCode).toBe(1);
  });

  it('should invoke interactive setup in normal mode (without --check-only)', async () => {
    // Mock ensureKaggleAuth to return false (auth failed)
    const authIndex = await import('../../../src/lib/auth/index.js');
    const ensureAuthSpy = vi.spyOn(authIndex, 'ensureKaggleAuth').mockResolvedValue(false);

    const authModule = await import('../../../src/cli/commands/auth.js');
    const command = authModule.default();

    await command.parseAsync(['node', 'cli', 'auth']); // No --check-only

    // ensureKaggleAuth SHOULD have been called in normal mode
    expect(ensureAuthSpy).toHaveBeenCalled();
    expect(exitCode).toBe(1);
  });

  it('should check env vars before kaggle.json (priority order)', async () => {
    // Setup both env vars AND kaggle.json
    process.env.KAGGLE_USERNAME = 'envuser';
    process.env.KAGGLE_KEY = 'envkey123';

    const kaggleDir = path.join(tmpHome, '.kaggle');
    await fs.mkdir(kaggleDir, { recursive: true });
    const file = path.join(kaggleDir, 'kaggle.json');
    await fs.writeFile(file, JSON.stringify({ username: 'fileuser', key: 'k'.repeat(40) }), 'utf8');
    await fs.chmod(file, 0o600);

    const authModule = await import('../../../src/cli/commands/auth.js');
    const command = authModule.default();

    await command.parseAsync(['node', 'cli', 'auth', '--check-only']);

    expect(exitCode).toBe(0);
    // Should report env vars first (priority)
    const output = consoleOutput.join('\n');
    expect(output).toContain('Found credentials in environment variables');
    // Should NOT check kaggle.json if env vars worked
    expect(output).not.toContain('Found credentials in kaggle.json');
  });

  it('should handle API verification failure gracefully', async () => {
    process.env.KAGGLE_USERNAME = 'testuser';
    process.env.KAGGLE_KEY = 'testkey123';

    // Mock execa to fail (API verification fails)
    const { execa } = await import('execa');
    vi.mocked(execa).mockRejectedValueOnce(new Error('API failed'));

    const authModule = await import('../../../src/cli/commands/auth.js');
    const command = authModule.default();

    await command.parseAsync(['node', 'cli', 'auth', '--check-only']);

    expect(exitCode).toBe(1);
    expect(consoleOutput.join('\n')).toContain('No valid credentials found');
  });
});
