# Kaggle Data API - Database Setup

This document describes the database schema and setup requirements for the kaggle-data-api service.

## Overview

The service uses PostgreSQL as the primary data store. The database connection is managed through a connection pool with efficient reuse of connections.

## Environment Variables

Configure the database connection using either:

### Option 1: Single CONNECTION_URL

```bash
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

### Option 2: Individual Parameters

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kaggle_data
DB_USER=postgres
DB_PASSWORD=password
```

## Connection Pool Configuration

The connection pool can be tuned with these optional variables:

```bash
# Maximum number of connections in the pool (default: 10)
DB_POOL_SIZE=20

# Idle timeout in milliseconds (default: 30000)
DB_IDLE_TIMEOUT=30000
```

## Database Schema

### Required Tables

#### datasets

Stores information about Kaggle datasets.

```sql
CREATE TABLE datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  owner VARCHAR(255),
  size_bytes BIGINT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_datasets_name ON datasets(name);
CREATE INDEX idx_datasets_owner ON datasets(owner);
```

### Initialization

To initialize the database with the required schema:

```bash
# Connect to your PostgreSQL database
psql -h localhost -U postgres -d kaggle_data

# Run the schema creation script
\i schema.sql
```

## API Endpoints

### GET /datasets

Fetches all datasets from the database.

**Response (200 OK):**

```json
{
  "datasets": [
    {
      "id": 1,
      "name": "dataset-name",
      "description": "Dataset description",
      "owner": "owner-username",
      "size_bytes": 1024000,
      "last_updated": "2025-10-26T12:00:00.000Z",
      "created_at": "2025-10-26T12:00:00.000Z"
    }
  ]
}
```

**Response (500 Internal Server Error):**

```json
{
  "error": "Failed to fetch datasets from database"
}
```

## Error Handling

The service implements comprehensive error handling:

1. **Missing Database**: Returns 500 with error message if database is unreachable
2. **Missing Table**: Returns 500 with error message if `datasets` table doesn't exist
3. **Connection Pool Exhaustion**: Connection pool waits for available connections
4. **Query Failures**: All errors are caught and logged, with generic error responses to clients

## Docker Compose Setup

For integration testing, the service runs with docker-compose which provides:

- PostgreSQL 16-alpine service on port 5432
- Pre-configured test database and credentials
- Health checks to ensure services are ready

**Test Database Credentials:**

```
Host: postgres (or localhost when using docker)
Port: 5432
Database: test_db
User: test_user
Password: test_password
```

## Connection Pooling Strategy

The service uses a **singleton pool pattern** for efficient connection management:

1. Pool is created on first query
2. Pool is reused for all subsequent queries
3. Connections are returned to the pool after use (not closed)
4. Pool has a maximum of 10 connections (configurable)
5. Idle connections are cleaned up after 30 seconds (configurable)

This approach ensures:

- Minimal connection overhead
- Efficient resource usage
- Better performance under load
- Connection reuse across requests

## Cleanup

To properly close the database connection pool:

```typescript
import { closePool } from './infrastructure/database.js';

// Call when shutting down the service
await closePool();
```

The pool is automatically managed by Fastify shutdown hooks in production.

## Monitoring

Monitor database health with these health check endpoints:

- **GET /health** - Service health status (200 OK if running)
- **docker-compose up** - Full integration test with PostgreSQL

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres Documentation](https://node-postgres.com/)
- [Connection Pooling Best Practices](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections)
