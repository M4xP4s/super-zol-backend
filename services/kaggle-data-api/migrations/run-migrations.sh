#!/usr/bin/env bash
#
# Database migration runner
# Runs all SQL migration files in order

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-postgresql.super-zol.svc.cluster.local}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-superzol}"
DB_USER="${DB_USER:-superzol}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info "Starting database migrations..."
log_info "Host: ${DB_HOST}:${DB_PORT}"
log_info "Database: ${DB_NAME}"
log_info "User: ${DB_USER}"

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    log_error "DB_PASSWORD environment variable is not set"
    exit 1
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Test database connection
log_info "Testing database connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    log_success "Database connection successful"
else
    log_error "Failed to connect to database"
    exit 1
fi

# Run migrations in order
log_info "Running migrations..."

for migration_file in "$SCRIPT_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        migration_name=$(basename "$migration_file")
        log_info "Running migration: $migration_name"

        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
            log_success "Migration completed: $migration_name"
        else
            log_error "Migration failed: $migration_name"
            exit 1
        fi
    fi
done

log_success "All migrations completed successfully!"

# Show dataset count
log_info "Verifying data..."
DATASET_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM datasets" | xargs)
log_success "Total datasets in database: $DATASET_COUNT"

exit 0
