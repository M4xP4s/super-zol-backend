# MCP Server Configuration Fix

## Problem

The `nx-mcp` MCP client was failing to handshake with "connection closed: initialize response" error.

## Root Cause

The `.mcp.json` configuration was trying to use `nx mcp` command, which doesn't exist in Nx 19.8.0:

```json
// ❌ INCORRECT (Nx 19.8.0)
"args": ["nx", "mcp"]
```

The `nx mcp` command was added in Nx 21.x+. Since this project uses Nx 19.8.0, it needs to use the standalone `nx-mcp` package instead.

## Solution Applied

Updated `.mcp.json` to use the standalone `nx-mcp` package:

```json
// ✅ CORRECT
"args": ["nx-mcp@latest"]
```

## Configuration Details

**Current Setup:**

```json
{
  "mcpServers": {
    "nx-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["nx-mcp@latest"]
    }
  }
}
```

**What it does:**

- Uses `npx` to run `nx-mcp@latest` (version 0.8.0)
- Communicates via stdio (standard input/output)
- Provides Nx workspace context to Claude Code and other AI tools

## Version Information

- **Nx Version**: 19.8.0
- **nx-mcp Version**: 0.8.0 (latest)
- **Nx `configure-ai-agents` Command**: Not available in 19.8.0 (available in Nx 21.x+)

## Notes for Future Upgrades

When upgrading Nx to 21.x+, you can optionally:

1. Run `npx nx configure-ai-agents` for automated MCP setup
2. Or continue using `nx-mcp@latest` package (works with newer Nx versions too)

Both approaches are compatible and work correctly.
