# fetch-kaggle CLI

Professional command-line interface for downloading and profiling Kaggle datasets.

## Installation

Build the CLI from the monorepo root:

```bash
# Build the project
pnpm nx build fetch-kaggle

# The CLI binary is available at:
# dist/jobs/fetch-kaggle/cli/index.js
```

## Quick Start

```bash
# Run complete workflow (auth → download → inventory → profile)
node dist/jobs/fetch-kaggle/cli/index.js all --dataset-id username/dataset-name

# Or run individual commands
node dist/jobs/fetch-kaggle/cli/index.js auth
node dist/jobs/fetch-kaggle/cli/index.js download --dataset-id username/dataset-name
node dist/jobs/fetch-kaggle/cli/index.js inventory
node dist/jobs/fetch-kaggle/cli/index.js profile
```

## Commands

### `auth` - Authenticate with Kaggle

Verify Kaggle API credentials from environment variables or `~/.kaggle/kaggle.json`.

```bash
# Check authentication status
node dist/jobs/fetch-kaggle/cli/index.js auth

# Check credentials without interactive setup
node dist/jobs/fetch-kaggle/cli/index.js auth --check-only
```

**Options:**

- `--check-only` - Verify credentials without running interactive setup

**Credential Sources** (checked in order):

1. Environment variables: `KAGGLE_USERNAME`, `KAGGLE_KEY`
2. File: `~/.kaggle/kaggle.json`
3. Interactive setup (if neither above found)

### `download` - Download Kaggle Dataset

Download a dataset from Kaggle and create a manifest file.

```bash
# Download dataset
node dist/jobs/fetch-kaggle/cli/index.js download --dataset-id username/dataset-name

# Simulate download without actually downloading files
node dist/jobs/fetch-kaggle/cli/index.js download --dataset-id username/dataset-name --dry-run
```

**Options:**

- `--dataset-id <id>` - Kaggle dataset ID (format: `username/dataset-name`)
- `--dry-run` - Simulate download without fetching files

**Output:**

- Downloads to: `data/kaggle_raw/YYYYMMDD/`
- Creates: `download_manifest.json` with file metadata

### `inventory` - Analyze Dataset Files

Generate an inventory report of downloaded files.

```bash
# Analyze latest download directory
node dist/jobs/fetch-kaggle/cli/index.js inventory

# Analyze specific directory
node dist/jobs/fetch-kaggle/cli/index.js inventory /path/to/dataset
```

**Arguments:**

- `[directory]` - Optional directory path (defaults to latest in `data/kaggle_raw/`)

**Output:**

- Report saved to: `data/reports/kaggle_inventory_YYYYMMDD.md`
- Includes: file counts, patterns, chains, file types

### `profile` - Profile Dataset Schema

Generate a schema profile with column statistics.

```bash
# Profile latest download
node dist/jobs/fetch-kaggle/cli/index.js profile

# Profile specific directory
node dist/jobs/fetch-kaggle/cli/index.js profile --data-dir /path/to/dataset

# Save profile to custom location
node dist/jobs/fetch-kaggle/cli/index.js profile --output /path/to/output.json
```

**Options:**

- `--data-dir <path>` - Directory containing dataset files (defaults to latest)
- `--output <path>` - Output JSON file path (defaults to `{data-dir}/metadata/data_profile_YYYYMMDD.json`)

**Output:**

- Profile JSON with column types, statistics, and sample values
- Selects representative files per family for profiling

### `all` - Run Complete Workflow

Execute the entire workflow: authenticate, download, inventory, and profile.

```bash
# Run full workflow
node dist/jobs/fetch-kaggle/cli/index.js all --dataset-id username/dataset-name

# Run with custom output location
node dist/jobs/fetch-kaggle/cli/index.js all \
  --dataset-id username/dataset-name \
  --output /path/to/profile.json

# Simulate workflow without downloading
node dist/jobs/fetch-kaggle/cli/index.js all \
  --dataset-id username/dataset-name \
  --dry-run
```

**Options:**

- `--dataset-id <id>` - Kaggle dataset ID (required unless `--dry-run`)
- `--dry-run` - Simulate download step
- `--data-dir <path>` - Override data directory
- `--output <path>` - Custom profile output path

**Workflow Steps:**

1. **Auth** - Verify Kaggle credentials
2. **Download** - Fetch dataset files
3. **Inventory** - Analyze file structure
4. **Profile** - Generate schema profile

If any step fails, the workflow aborts with exit code 1.

## Usage via Nx

Run commands through Nx (from monorepo root):

```bash
pnpm nx cli fetch-kaggle -- --help
pnpm nx cli fetch-kaggle -- auth
pnpm nx cli fetch-kaggle -- download --dataset-id username/dataset-name
pnpm nx cli fetch-kaggle -- all --dataset-id username/dataset-name
```

## Exit Codes

- `0` - Success
- `1` - Error (authentication failed, download failed, invalid arguments, etc.)

## Common Workflows

### First Time Setup

```bash
# 1. Authenticate
node dist/jobs/fetch-kaggle/cli/index.js auth

# 2. Download a dataset
node dist/jobs/fetch-kaggle/cli/index.js download --dataset-id username/dataset-name

# 3. Analyze the dataset
node dist/jobs/fetch-kaggle/cli/index.js inventory
node dist/jobs/fetch-kaggle/cli/index.js profile
```

### Quick Dataset Analysis

```bash
# One command to do it all
node dist/jobs/fetch-kaggle/cli/index.js all --dataset-id username/dataset-name
```

### Testing Before Download

```bash
# Dry run to verify credentials and dataset exists
node dist/jobs/fetch-kaggle/cli/index.js download \
  --dataset-id username/dataset-name \
  --dry-run
```

### Re-analyzing Existing Data

```bash
# Re-run inventory and profile on latest download
node dist/jobs/fetch-kaggle/cli/index.js inventory
node dist/jobs/fetch-kaggle/cli/index.js profile
```

## Troubleshooting

### Authentication Fails

```bash
# Check your credentials
node dist/jobs/fetch-kaggle/cli/index.js auth --check-only

# Verify kaggle.json exists
cat ~/.kaggle/kaggle.json

# Or set environment variables
export KAGGLE_USERNAME="your-username"
export KAGGLE_KEY="your-api-key"
```

### No Download Directories Found

If `inventory` or `profile` fail with "No download directories found":

```bash
# Run download first
node dist/jobs/fetch-kaggle/cli/index.js download --dataset-id username/dataset-name

# Or specify directory explicitly
node dist/jobs/fetch-kaggle/cli/index.js profile --data-dir /path/to/dataset
```

### Command Not Found

Ensure you've built the project:

```bash
pnpm nx build fetch-kaggle
```

## Development

### Running Tests

```bash
# Run all tests
pnpm nx test fetch-kaggle

# Run with coverage
pnpm nx test fetch-kaggle --coverage

# Run in watch mode
just test-watch fetch-kaggle
```

### Linting

```bash
pnpm nx lint fetch-kaggle
```

### Building

```bash
pnpm nx build fetch-kaggle
```

## Architecture

The CLI is a thin wrapper around library functions:

```
src/cli/
├── index.ts              # Main entry point
└── commands/
    ├── auth.ts           # → lib/auth/
    ├── download.ts       # → lib/download/
    ├── inventory.ts      # → lib/inventory/
    ├── profile.ts        # → lib/profile/
    └── all.ts            # Orchestrates all commands
```

**Design Principle**: Zero business logic in CLI layer. All commands delegate to library functions for testability and reusability.

## Configuration

Default paths (configurable via `infrastructure/config.ts`):

- **Data Root**: `data/kaggle_raw/`
- **Reports**: `data/reports/`
- **Profiles**: `{dataset-dir}/metadata/`

## Version

```bash
node dist/jobs/fetch-kaggle/cli/index.js --version
```

## License

Part of the super-zol monorepo backend project.
