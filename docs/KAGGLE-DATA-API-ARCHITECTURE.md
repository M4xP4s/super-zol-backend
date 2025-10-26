# Kaggle Data API Service - Architecture

## Executive Summary

This document outlines the architecture for a production-ready REST API service that serves data from the Israeli Supermarkets 2024 Kaggle dataset. The service will provide structured access to supermarket pricing data, supporting queries, filtering, aggregations, and analytics capabilities.

**Key Objectives:**

- Serve Kaggle dataset data via RESTful API endpoints
- Support high-performance queries and analytics
- Provide data quality and validation guarantees
- Enable horizontal scaling for production workloads
- Maintain clear separation between data ingestion and serving layers

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Component Architecture](#component-architecture)
- [Data Architecture](#data-architecture)
- [API Design](#api-design)
- [Technology Stack](#technology-stack)
- [Infrastructure](#infrastructure)
- [Security](#security)
- [Observability](#observability)
- [Deployment Architecture](#deployment-architecture)

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│              (Web App, Mobile App, Analytics Tools)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/REST
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API Gateway / Load Balancer                 │
│                        (Ingress Controller)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
┌─────────────▼──────────────┐  ┌──────────▼──────────────┐
│   Kaggle Data API Service   │  │   Other API Services    │
│    (Fastify + TypeScript)   │  │   (Future Services)     │
│                             │  │                         │
│  ┌─────────────────────┐   │  └─────────────────────────┘
│  │  Routes Layer       │   │
│  │  - Products         │   │
│  │  - Prices           │   │
│  │  - Stores           │   │
│  │  - Analytics        │   │
│  └──────────┬──────────┘   │
│             │              │
│  ┌──────────▼──────────┐   │
│  │  Business Logic     │   │
│  │  (Service Layer)    │   │
│  └──────────┬──────────┘   │
│             │              │
│  ┌──────────▼──────────┐   │
│  │  Data Access Layer  │   │
│  │  (Repository)       │   │
│  └──────────┬──────────┘   │
└─────────────┼──────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────────────┐  ┌──▼──────────────┐
│   PostgreSQL    │  │  Redis Cache    │
│   (Primary DB)  │  │  (Optional)     │
│                 │  │                 │
│  - Products     │  │  - Query Cache  │
│  - Prices       │  │  - Sessions     │
│  - Stores       │  │  - Rate Limits  │
│  - Metadata     │  │                 │
└────────▲────────┘  └─────────────────┘
         │
         │ Read-only access
         │
┌────────┴────────────────────────────────────────────────────────┐
│                   Data Ingestion Pipeline                        │
│                     (fetch-kaggle Job)                           │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Download │───▶│ Process  │───▶│ Validate │───▶│  Load DB │  │
│  │ from     │    │ CSV      │    │ Schema   │    │ (ETL)    │  │
│  │ Kaggle   │    │ Files    │    │ & Data   │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
│  Storage: Shared Volume (PVC) or S3-compatible (MinIO)          │
└──────────────────────────────────────────────────────────────────┘
```

### System Context

The Kaggle Data API Service operates as part of a larger data platform:

1. **Data Ingestion Layer** - Existing `fetch-kaggle` job downloads and processes raw CSV data
2. **Data Storage Layer** - PostgreSQL database stores structured, queryable data
3. **API Service Layer** - New REST API service (this architecture)
4. **Cache Layer** - Redis for performance optimization (optional Phase 2+)
5. **Client Layer** - Web apps, mobile apps, analytics tools consuming the API

## Architecture Principles

### 1. Hexagonal (Ports & Adapters) Architecture

Following the existing pattern in `fetch-kaggle` job:

```
┌──────────────────────────────────────────────────────────────┐
│                        Inbound Adapters                       │
│                    (HTTP Controllers/Routes)                  │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                         Core Domain                           │
│                                                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │   Entities      │  │  Business Logic  │  │  Use Cases │  │
│  │   - Product     │  │  - Pricing       │  │  - Query   │  │
│  │   - Price       │  │  - Validation    │  │  - Filter  │  │
│  │   - Store       │  │  - Aggregation   │  │  - Analyze │  │
│  └─────────────────┘  └──────────────────┘  └────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Outbound Ports                          │    │
│  │  (Interfaces for external dependencies)              │    │
│  └──────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                      Outbound Adapters                        │
│                                                               │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   PostgreSQL   │  │    Redis     │  │   File System   │  │
│  │   Repository   │  │   Adapter    │  │    Adapter      │  │
│  └────────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

**Benefits:**

- Business logic independent of frameworks and databases
- Easy to test (mock adapters)
- Easy to swap implementations (e.g., PostgreSQL → MongoDB)
- Clear dependency flow (inward toward domain)

### 2. Clean Architecture Layers

```
┌──────────────────────────────────────────────────────────┐
│  Layer 1: Routes/Controllers (API Contract)              │
│  - HTTP request/response handling                        │
│  - Input validation (Zod schemas)                        │
│  - Authentication/Authorization                          │
│  - Error handling & status codes                         │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  Layer 2: Services (Business Logic)                      │
│  - Use case orchestration                                │
│  - Domain rules enforcement                              │
│  - Data transformation                                   │
│  - Cross-cutting concerns                                │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  Layer 3: Repositories (Data Access)                     │
│  - Database queries                                      │
│  - Query optimization                                    │
│  - Transaction management                                │
│  - Data mapping (DB ↔ Domain)                            │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  Layer 4: Infrastructure (External Systems)              │
│  - PostgreSQL client                                     │
│  - Redis client                                          │
│  - Logging & monitoring                                  │
│  - Configuration                                         │
└──────────────────────────────────────────────────────────┘
```

### 3. Key Design Principles

| Principle                 | Implementation                                      |
| ------------------------- | --------------------------------------------------- |
| **Single Responsibility** | Each service/repository handles one concern         |
| **Dependency Inversion**  | Core depends on abstractions, not implementations   |
| **Interface Segregation** | Clients depend only on methods they use             |
| **Open/Closed**           | Open for extension, closed for modification         |
| **DRY**                   | Shared utilities in `@libs/shared-util`             |
| **Type Safety**           | Strict TypeScript with no `any` types               |
| **Immutability**          | Read-only properties, pure functions where possible |
| **Error Handling**        | Explicit error types, no silent failures            |

## Component Architecture

### Service Structure

```
services/kaggle-data-api/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app/
│   │   ├── app.ts                 # Fastify app setup
│   │   ├── plugins/               # Fastify plugins
│   │   │   ├── cors.ts
│   │   │   ├── sensible.ts
│   │   │   ├── helmet.ts
│   │   │   └── swagger.ts         # API documentation
│   │   └── routes/                # HTTP route handlers
│   │       ├── health.ts          # Health check endpoint
│   │       ├── products.ts        # Product endpoints
│   │       ├── prices.ts          # Price endpoints
│   │       ├── stores.ts          # Store endpoints
│   │       └── analytics.ts       # Analytics/aggregation endpoints
│   ├── core/
│   │   ├── domain/                # Domain models
│   │   │   ├── entities/
│   │   │   │   ├── product.ts
│   │   │   │   ├── price.ts
│   │   │   │   └── store.ts
│   │   │   └── value-objects/
│   │   │       ├── price-range.ts
│   │   │       └── date-range.ts
│   │   ├── ports/                 # Interface definitions
│   │   │   ├── inbound/
│   │   │   │   ├── product-service.port.ts
│   │   │   │   └── analytics-service.port.ts
│   │   │   └── outbound/
│   │   │       ├── product-repository.port.ts
│   │   │       └── cache.port.ts
│   │   └── services/              # Business logic
│   │       ├── product.service.ts
│   │       ├── price.service.ts
│   │       └── analytics.service.ts
│   ├── adapters/
│   │   ├── inbound/               # Entry points
│   │   │   └── http/
│   │   │       └── (routes defined in app/routes/)
│   │   └── outbound/              # External system adapters
│   │       ├── postgres/
│   │       │   ├── product.repository.ts
│   │       │   ├── price.repository.ts
│   │       │   └── migrations/
│   │       └── redis/
│   │           └── cache.adapter.ts
│   └── infrastructure/
│       ├── config.ts              # Environment configuration
│       ├── database.ts            # Database connection
│       ├── logger.ts              # Structured logging
│       └── zod-schemas.ts         # Validation schemas
├── tests/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── e2e/                       # End-to-end API tests
├── project.json                   # Nx configuration
├── tsconfig.json
├── tsconfig.app.json
└── vitest.config.ts
```

### Module Dependencies

```mermaid
graph TD
    Routes --> Services
    Services --> Repositories
    Repositories --> Database
    Services --> Cache
    Routes -.-> ValidationSchemas
    Services -.-> DomainEntities
    Repositories -.-> DomainEntities
```

## Data Architecture

### Database Schema Design

#### Tables Overview

```sql
-- Stores table
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    kaggle_store_id VARCHAR(100) UNIQUE NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    chain_name VARCHAR(255),
    city VARCHAR(100),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    kaggle_product_id VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_name_normalized VARCHAR(500), -- For search
    manufacturer VARCHAR(255),
    category VARCHAR(255),
    subcategory VARCHAR(255),
    unit_of_measure VARCHAR(50),
    unit_quantity DECIMAL(10, 2),
    barcode VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prices table (fact table)
CREATE TABLE prices (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    is_on_sale BOOLEAN DEFAULT FALSE,
    observation_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT prices_product_store_date_unique UNIQUE (product_id, store_id, observation_date),
    CONSTRAINT prices_positive_price CHECK (price > 0),
    CONSTRAINT prices_valid_discount CHECK (discount_price IS NULL OR discount_price < price)
);

-- Dataset metadata table
CREATE TABLE dataset_metadata (
    id SERIAL PRIMARY KEY,
    dataset_id VARCHAR(100) NOT NULL,
    download_date DATE NOT NULL,
    total_records INTEGER NOT NULL,
    total_files INTEGER NOT NULL,
    manifest_path TEXT,
    status VARCHAR(50) NOT NULL, -- 'processing', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT dataset_metadata_unique_date UNIQUE (dataset_id, download_date)
);
```

#### Indexes for Performance

```sql
-- Stores indexes
CREATE INDEX idx_stores_chain ON stores(chain_name);
CREATE INDEX idx_stores_city ON stores(city);

-- Products indexes
CREATE INDEX idx_products_name ON products(product_name_normalized);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_manufacturer ON products(manufacturer);
CREATE INDEX idx_products_barcode ON products(barcode);

-- Prices indexes (critical for performance)
CREATE INDEX idx_prices_product_id ON prices(product_id);
CREATE INDEX idx_prices_store_id ON prices(store_id);
CREATE INDEX idx_prices_observation_date ON prices(observation_date DESC);
CREATE INDEX idx_prices_product_date ON prices(product_id, observation_date DESC);
CREATE INDEX idx_prices_store_date ON prices(store_id, observation_date DESC);

-- Composite index for common query pattern
CREATE INDEX idx_prices_product_store_date ON prices(product_id, store_id, observation_date DESC);
```

#### Data Normalization Strategy

**Approach:** 3rd Normal Form (3NF) with denormalization where needed for performance

**Rationale:**

- **Stores & Products** - Normalized to avoid duplication
- **Prices** - Fact table with foreign keys (star schema style)
- **Denormalization** - Consider materialized views for heavy analytics queries

**Example Materialized View:**

```sql
CREATE MATERIALIZED VIEW product_price_summary AS
SELECT
    p.id AS product_id,
    p.product_name,
    p.category,
    COUNT(DISTINCT pr.store_id) AS store_count,
    MIN(pr.price) AS min_price,
    MAX(pr.price) AS max_price,
    AVG(pr.price) AS avg_price,
    MAX(pr.observation_date) AS latest_observation
FROM products p
LEFT JOIN prices pr ON p.id = pr.product_id
GROUP BY p.id, p.product_name, p.category;

CREATE UNIQUE INDEX idx_product_price_summary_id ON product_price_summary(product_id);
```

### Data Flow Architecture

#### 1. Data Ingestion Flow (ETL)

```
┌──────────────┐
│ Kaggle API   │
└──────┬───────┘
       │
       │ 1. Download CSV files
       ▼
┌──────────────────┐
│ fetch-kaggle Job │
│ (Existing)       │
└──────┬───────────┘
       │
       │ 2. Process & Validate
       ▼
┌────────────────────┐
│ Shared Storage     │
│ (PVC or S3/MinIO)  │
│                    │
│ /data/kaggle/      │
│   YYYYMMDD/        │
│     - *.csv        │
│     - manifest.json│
└──────┬─────────────┘
       │
       │ 3. ETL Process
       ▼
┌──────────────────┐
│ ETL Service      │
│ (New Component)  │
│                  │
│ - Read CSV       │
│ - Transform      │
│ - Load to DB     │
└──────┬───────────┘
       │
       │ 4. Load structured data
       ▼
┌──────────────────┐
│ PostgreSQL       │
│ - Stores         │
│ - Products       │
│ - Prices         │
└──────────────────┘
```

#### 2. Query Flow (API Request)

```
Client Request
     │
     ▼
┌─────────────────┐
│ Route Handler   │
│ - Validate      │
│ - Authenticate  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ Service Layer   │────▶│ Redis Cache  │
│ - Check cache   │◀────│ (Optional)   │
└────────┬────────┘     └──────────────┘
         │
         │ Cache miss
         ▼
┌─────────────────┐
│ Repository      │
│ - Build query   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │
│ - Execute query │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Layer   │
│ - Transform     │
│ - Cache result  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Route Handler   │
│ - Format JSON   │
└────────┬────────┘
         │
         ▼
   Client Response
```

### Data Storage Strategy

#### Phase 1: File System Approach

**Current State:**

- Data stored in `jobs/fetch-kaggle/data/kaggle_raw/YYYYMMDD/`

**Proposed Change:**

- Move to shared volume: `/data/kaggle/YYYYMMDD/`
- Accessible by both fetch-kaggle job and ETL service

**Directory Structure:**

```
/data/
└── kaggle/
    ├── raw/                    # Raw downloaded files
    │   └── YYYYMMDD/
    │       ├── *.csv
    │       └── download_manifest.json
    ├── processed/              # Transformed data
    │   └── YYYYMMDD/
    │       └── load_summary.json
    └── archive/                # Historical backups
        └── YYYYMMDD.tar.gz
```

#### Phase 2+: Object Storage (S3/MinIO)

For production scale:

- Raw files → S3/MinIO bucket: `kaggle-raw-data`
- Processed → S3/MinIO bucket: `kaggle-processed-data`
- Benefits: Unlimited storage, versioning, lifecycle policies

## API Design

### RESTful API Endpoints

#### Base URL

```
https://api.superzol.com/v1
```

#### Authentication

```
Authorization: Bearer <jwt-token>
API-Key: <api-key>
```

#### Endpoints Structure

##### 1. Products API

```
GET    /products                    # List all products
GET    /products/:id                # Get product by ID
GET    /products/search?q=milk      # Search products
GET    /products/:id/prices         # Get price history for product
GET    /products/:id/stores         # Get stores selling product
GET    /products/categories         # List all categories
GET    /products/manufacturers      # List all manufacturers
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 1234,
      "kaggle_product_id": "prod_abc123",
      "product_name": "Tnuva Milk 3% 1L",
      "manufacturer": "Tnuva",
      "category": "Dairy",
      "subcategory": "Milk",
      "barcode": "7290000000123",
      "current_price": {
        "min": 5.9,
        "max": 7.5,
        "avg": 6.45
      },
      "store_count": 42
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 15000,
    "total_pages": 750
  }
}
```

##### 2. Prices API

```
GET    /prices                      # List all prices (paginated)
GET    /prices?product_id=123       # Filter by product
GET    /prices?store_id=456         # Filter by store
GET    /prices?from=2024-01-01      # Filter by date range
GET    /prices/trends               # Price trends and analytics
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 98765,
      "product": {
        "id": 1234,
        "name": "Tnuva Milk 3% 1L"
      },
      "store": {
        "id": 456,
        "name": "Shufersal Haifa Center",
        "chain": "Shufersal"
      },
      "price": 6.5,
      "discount_price": 5.9,
      "is_on_sale": true,
      "observation_date": "2024-10-25"
    }
  ]
}
```

##### 3. Stores API

```
GET    /stores                      # List all stores
GET    /stores/:id                  # Get store by ID
GET    /stores?city=Haifa           # Filter by city
GET    /stores?chain=Shufersal      # Filter by chain
GET    /stores/:id/products         # Get products in store
GET    /stores/:id/prices           # Get prices in store
```

##### 4. Analytics API

```
GET    /analytics/price-comparison    # Compare prices across stores
GET    /analytics/trends              # Price trends over time
GET    /analytics/cheapest-stores     # Cheapest stores by category
GET    /analytics/basket-cost         # Calculate basket cost by store
POST   /analytics/custom-query        # Custom analytical queries
```

**Example Request:**

```json
POST /analytics/basket-cost
{
  "products": [1234, 5678, 9012],
  "stores": [456, 789],
  "date": "2024-10-25"
}
```

**Example Response:**

```json
{
  "data": {
    "basket_items": 3,
    "comparison": [
      {
        "store_id": 456,
        "store_name": "Shufersal Haifa Center",
        "total_cost": 45.80,
        "savings": 0,
        "items": [
          { "product_id": 1234, "price": 6.50 },
          { "product_id": 5678, "price": 22.90 },
          { "product_id": 9012, "price": 16.40 }
        ]
      },
      {
        "store_id": 789,
        "store_name": "Victory Tel Aviv",
        "total_cost": 48.20,
        "savings": -2.40,
        "items": [...]
      }
    ]
  }
}
```

##### 5. Health & Metadata API

```
GET    /health                      # Health check
GET    /health/ready                # Readiness probe
GET    /health/live                 # Liveness probe
GET    /metadata/datasets           # List available datasets
GET    /metadata/stats              # Database statistics
```

### API Standards

#### Pagination

```
?page=1&per_page=20
```

#### Sorting

```
?sort=price:asc&sort=name:desc
```

#### Filtering

```
?category=Dairy&price_min=5&price_max=10
```

#### Response Format

```json
{
  "data": [...],
  "meta": {
    "timestamp": "2024-10-25T12:00:00Z",
    "version": "1.0.0"
  },
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1000,
    "total_pages": 50
  }
}
```

#### Error Response

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 1234 not found",
    "status": 404,
    "timestamp": "2024-10-25T12:00:00Z"
  }
}
```

### OpenAPI/Swagger Documentation

Auto-generated from Zod schemas and route definitions using `@fastify/swagger` plugin.

## Technology Stack

### Core Technologies

| Component             | Technology        | Version | Rationale                                |
| --------------------- | ----------------- | ------- | ---------------------------------------- |
| **Runtime**           | Node.js           | 22 LTS  | Latest LTS, modern features              |
| **Language**          | TypeScript        | 5.6+    | Type safety, developer experience        |
| **API Framework**     | Fastify           | 4.x     | High performance, extensive plugins      |
| **Database**          | PostgreSQL        | 16+     | ACID, JSON support, full-text search     |
| **ORM/Query Builder** | Kysely or Drizzle | Latest  | Type-safe, lightweight, SQL-first        |
| **Validation**        | Zod               | 3.x     | Runtime type checking, schema validation |
| **Caching**           | Redis             | 7.x     | High-performance in-memory cache         |
| **Testing**           | Vitest            | Latest  | Fast, modern, ESM-native                 |

### Supporting Libraries

```json
{
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/cors": "^8.5.0",
    "@fastify/helmet": "^11.1.1",
    "@fastify/sensible": "^5.5.0",
    "@fastify/swagger": "^8.13.0",
    "@fastify/swagger-ui": "^2.1.0",
    "kysely": "^0.27.0",
    "pg": "^8.11.0",
    "zod": "^3.22.0",
    "pino": "^8.17.0",
    "ioredis": "^5.3.0"
  }
}
```

### Why These Choices?

**Fastify over Express:**

- 2-3x faster request handling
- Built-in JSON schema validation
- Better TypeScript support
- Modern plugin architecture

**Kysely over Prisma/TypeORM:**

- Type-safe SQL queries
- No code generation
- Lightweight (no runtime overhead)
- Full SQL control
- Better for complex analytics queries

**PostgreSQL over NoSQL:**

- Dataset is highly relational (stores ↔ products ↔ prices)
- ACID guarantees for data integrity
- Powerful query capabilities (JOINs, aggregations)
- JSON columns for flexibility when needed

## Infrastructure

### Container Architecture

```dockerfile
# Dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build kaggle-data-api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist/services/kaggle-data-api ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "main.js"]
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: kaggle_data
      POSTGRES_USER: kaggle
      POSTGRES_PASSWORD: dev_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U kaggle']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      target: runner
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://kaggle:dev_password@postgres:5432/kaggle_data
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Resources

#### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kaggle-data-api
  namespace: super-zol
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kaggle-data-api
  template:
    metadata:
      labels:
        app: kaggle-data-api
        version: v1
    spec:
      containers:
        - name: api
          image: registry.example.com/kaggle-data-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: connection-string
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: kaggle-data-api
  namespace: super-zol
spec:
  selector:
    app: kaggle-data-api
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

#### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kaggle-data-api
  namespace: super-zol
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.superzol.com
      secretName: api-tls
  rules:
    - host: api.superzol.com
      http:
        paths:
          - path: /v1
            pathType: Prefix
            backend:
              service:
                name: kaggle-data-api
                port:
                  number: 80
```

## Security

### Authentication & Authorization

#### API Key Authentication (Phase 1)

```typescript
// Simple API key middleware
fastify.addHook('onRequest', async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || !isValidApiKey(apiKey)) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});
```

#### JWT Authentication (Phase 2+)

```typescript
// JWT-based auth with role-based access control
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET,
});

fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});
```

### Security Best Practices

1. **Input Validation** - Zod schemas for all inputs
2. **SQL Injection Prevention** - Parameterized queries (Kysely)
3. **Rate Limiting** - Per-IP and per-API-key limits
4. **CORS** - Whitelist allowed origins
5. **Helmet** - Security headers (CSP, HSTS, etc.)
6. **Secrets Management** - Environment variables, Kubernetes secrets
7. **TLS** - HTTPS everywhere (cert-manager)
8. **Audit Logging** - Log all API access

## Observability

### Logging

```typescript
// Structured logging with Pino
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

logger.info(
  {
    product_id: 1234,
    duration: 45,
  },
  'Product fetched'
);
```

### Metrics

**Key Metrics to Track:**

- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Database query time
- Cache hit rate
- Active connections

**Tools:**

- Prometheus (metrics collection)
- Grafana (visualization)
- Fastify metrics plugin

### Tracing

**Distributed Tracing:**

- OpenTelemetry integration
- Trace ID propagation
- Request → Service → Database correlation

### Health Checks

```typescript
// Liveness probe
fastify.get('/health/live', async () => ({ status: 'ok' }));

// Readiness probe
fastify.get('/health/ready', async () => {
  const dbOk = await checkDatabase();
  const redisOk = await checkRedis();
  return {
    status: dbOk && redisOk ? 'ready' : 'not_ready',
    database: dbOk,
    redis: redisOk,
  };
});
```

## Deployment Architecture

### Helm Chart Structure

```
helm/kaggle-data-api/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-production.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── hpa.yaml
    ├── pdb.yaml
    └── servicemonitor.yaml
```

### Helm Values Structure

```yaml
# values.yaml
replicaCount: 3

image:
  repository: registry.example.com/kaggle-data-api
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.superzol.com
      paths:
        - path: /v1
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.superzol.com

resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

postgresql:
  enabled: true # Use subchart for dev
  auth:
    database: kaggle_data
    username: kaggle
    password: changeme

redis:
  enabled: true # Use subchart for dev
  auth:
    enabled: false

env:
  - name: NODE_ENV
    value: production
  - name: LOG_LEVEL
    value: info

envFrom:
  - secretRef:
      name: kaggle-data-api-secrets
```

### Environment-Specific Values

```yaml
# values-production.yaml
replicaCount: 5

autoscaling:
  minReplicas: 5
  maxReplicas: 20

postgresql:
  enabled: false # Use external managed DB

externalDatabase:
  host: postgres.example.com
  port: 5432
  database: kaggle_data
  existingSecret: postgres-credentials

redis:
  enabled: false # Use external managed Redis

externalRedis:
  host: redis.example.com
  port: 6379
  existingSecret: redis-credentials

resources:
  requests:
    memory: 512Mi
    cpu: 500m
  limits:
    memory: 1Gi
    cpu: 1000m
```

## Next Steps

See [KAGGLE-DATA-API-PLAN.md](./KAGGLE-DATA-API-PLAN.md) for detailed implementation phases, tasks, and timeline.

---

**Document Version:** 1.0.0
**Last Updated:** 2024-10-26
**Authors:** Claude Code Agent
**Status:** Draft - Ready for Review
