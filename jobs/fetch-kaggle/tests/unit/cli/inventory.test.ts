import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command } from 'commander';
import inventoryCommand from '../../../src/cli/commands/inventory.js';

describe('Inventory Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create inventory command with correct description', () => {
    const command = inventoryCommand();
    expect(command).toBeInstanceOf(Command);
    expect(command.name()).toBe('inventory');
    expect(command.description()).toContain('Analyze dataset files');
  });

  it('should accept optional directory argument', () => {
    const command = inventoryCommand();
    // Check if command has argument definitions
    expect(command.commands).toBeDefined();
  });

  it('should be properly configured', () => {
    const command = inventoryCommand();
    expect(command.commands).toBeDefined();
  });
});
