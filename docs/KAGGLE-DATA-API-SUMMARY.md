# Kaggle Data API - Project Summary

## Overview

This document provides a high-level summary of the Kaggle Data API service architecture and implementation plan.

## What We're Building

A production-ready **REST API service** that serves data from the Israeli Supermarkets 2024 Kaggle dataset, providing:

- 📊 **Product Information** - Search and browse supermarket products
- 💰 **Price Data** - Historical and current pricing across stores
- 🏪 **Store Information** - Supermarket locations and chains
- 📈 **Analytics** - Price comparisons, trends, and basket cost calculations

## Key Documents

| Document                                                   | Purpose                                             | Audience                    |
| ---------------------------------------------------------- | --------------------------------------------------- | --------------------------- |
| **[ARCHITECTURE.md](./KAGGLE-DATA-API-ARCHITECTURE.md)**   | Technical architecture, database schema, API design | Engineers, Architects       |
| **[PLAN.md](./KAGGLE-DATA-API-PLAN.md)**                   | Implementation phases, tasks, timeline              | Project Managers, Engineers |
| **[Helm Chart README](../helm/kaggle-data-api/README.md)** | Deployment guide, configuration reference           | DevOps, SRE                 |

## Architecture Highlights

### System Components

```
Clients → API Gateway → REST API Service → PostgreSQL Database
                              ↓
                         Redis Cache (optional)
```

### Technology Stack

- **Runtime**: Node.js 22
- **Framework**: Fastify 4.x
- **Database**: PostgreSQL 16+
- **Cache**: Redis 7.x (optional)
- **Query Builder**: Kysely (type-safe SQL)
- **Validation**: Zod
- **Testing**: Vitest
- **Deployment**: Kubernetes + Helm

### Data Flow

1. **Ingestion** - `fetch-kaggle` job downloads CSV files from Kaggle
2. **ETL** - Transform and load data into PostgreSQL
3. **API** - Serve data via REST endpoints
4. **Caching** - Optional Redis layer for performance

## Implementation Phases

### Phase 0: Pre-Implementation (1 week)

- Move data storage from job-local to shared volume
- Design and validate database schema

### Phase 1: Foundation (2 weeks)

- Generate service skeleton
- Implement database layer
- Build ETL pipeline to load CSV data

### Phase 2: Core API (2 weeks)

- Implement domain models
- Create service layer (business logic)
- Build REST endpoints (products, prices, stores, analytics)

### Phase 3: Advanced Features (1.5 weeks)

- Add Redis caching
- Implement API documentation (Swagger)
- Add rate limiting and security
- Set up observability (logging, metrics, tracing)

### Phase 4: Production Deployment (1.5 weeks)

- Create Helm charts
- Build CI/CD pipeline
- Deploy to staging and production

**Total Timeline**: 8 weeks

## API Endpoints

### Products

```
GET /v1/products                   # List products
GET /v1/products/:id               # Get product details
GET /v1/products/search?q=milk     # Search products
GET /v1/products/:id/prices        # Price history
```

### Prices

```
GET /v1/prices                     # List prices
GET /v1/prices?product_id=123      # Filter by product
GET /v1/prices/trends              # Price trends
```

### Stores

```
GET /v1/stores                     # List stores
GET /v1/stores/:id                 # Store details
GET /v1/stores/:id/products        # Products in store
```

### Analytics

```
GET  /v1/analytics/price-comparison  # Compare prices
POST /v1/analytics/basket-cost       # Calculate basket cost
GET  /v1/analytics/cheapest-stores   # Cheapest stores
```

## Database Schema

### Core Tables

1. **stores** - Store locations and information
   - id, kaggle_store_id, store_name, chain_name, city, address

2. **products** - Product catalog
   - id, kaggle_product_id, product_name, category, manufacturer, barcode

3. **prices** - Price observations (fact table)
   - id, product_id, store_id, price, discount_price, observation_date

4. **dataset_metadata** - ETL tracking
   - id, dataset_id, download_date, status

### Indexes

Comprehensive indexing strategy for:

- Fast product search by name
- Quick price lookups by product/store/date
- Efficient analytics queries

## Deployment Architecture

### Kubernetes Resources

- **Deployment** - API service with 3+ replicas
- **Service** - ClusterIP service exposing port 80
- **Ingress** - HTTPS endpoint with TLS
- **HPA** - Horizontal Pod Autoscaler (3-10 pods)
- **PDB** - Pod Disruption Budget (min 2 available)
- **PVC** - Persistent volume for Kaggle data
- **ConfigMap** - Application configuration
- **Secrets** - Database credentials, API keys

### Helm Chart

Location: `helm/kaggle-data-api/`

**Values Files:**

- `values.yaml` - Default configuration
- `values-dev.yaml` - Development environment
- `values-staging.yaml` - Staging environment
- `values-production.yaml` - Production environment

**Install:**

```bash
helm install kaggle-data-api ./helm/kaggle-data-api \
  -f helm/kaggle-data-api/values-production.yaml \
  --namespace super-zol
```

## Quality Standards

### Test Coverage

- **Target**: ≥90% coverage
- **Unit Tests**: ~70% of tests
- **Integration Tests**: ~25% of tests
- **E2E Tests**: ~5% of tests

### Performance Targets

- **Response Time**: <200ms (p95)
- **Throughput**: 100+ requests/second
- **Uptime**: ≥99.5%

### Code Quality

- TypeScript strict mode
- No `any` types
- ESLint + Prettier
- Conventional Commits

## Migration Plan

### Step 1: Data Storage Migration

**Current:**

```
jobs/fetch-kaggle/data/kaggle_raw/YYYYMMDD/
```

**Proposed:**

```
/data/kaggle/
├── raw/YYYYMMDD/          # Raw CSV files
├── processed/YYYYMMDD/    # Transformed data
└── archive/YYYYMMDD.tar.gz # Historical backups
```

**Why?**

- Shared access between fetch-kaggle job and API service
- Better separation of concerns
- Easier to manage in Kubernetes (PVC)

### Step 2: Configuration Updates

Update `fetch-kaggle` configuration:

```typescript
// FROM:
dataRoot: join(JOB_ROOT, 'data', 'kaggle_raw');

// TO:
dataRoot: process.env.KAGGLE_DATA_ROOT || '/data/kaggle/raw';
```

## Security Considerations

1. **Authentication** - API key (Phase 1) → JWT (Phase 2+)
2. **Rate Limiting** - 100 requests/minute per API key
3. **Input Validation** - Zod schemas for all inputs
4. **SQL Injection** - Parameterized queries (Kysely)
5. **HTTPS** - TLS everywhere (cert-manager)
6. **Secrets** - Kubernetes secrets + external vault
7. **Network Policies** - Restrict pod-to-pod traffic
8. **Security Context** - Run as non-root user

## Monitoring & Observability

### Logging

- **Format**: Structured JSON (Pino)
- **Levels**: debug, info, warn, error
- **Fields**: request_id, user_id, duration, status

### Metrics

- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Database query time
- Cache hit rate

### Health Checks

- **Liveness**: `/health/live` - Is process running?
- **Readiness**: `/health/ready` - Can it serve traffic?

### Tracing

- OpenTelemetry integration
- Distributed tracing across services
- Request → Service → Database correlation

## Next Steps

1. ✅ **Review Architecture** - Validate design decisions
2. ✅ **Review Implementation Plan** - Confirm timeline and approach
3. ✅ **Review Helm Charts** - Validate Kubernetes resources
4. 🔜 **Begin Implementation** - Start with Phase 0 (data migration)
5. 🔜 **Set Up Project Board** - Track tasks and progress

## Quick Start (For Developers)

### Prerequisites

```bash
# Ensure you have:
- Node.js 22
- pnpm 10
- Docker & Docker Compose
- kubectl & helm
- Just (optional)
```

### Development Setup

```bash
# 1. Generate service
just gen-service kaggle-data-api

# 2. Start infrastructure
docker-compose up -d postgres redis

# 3. Run migrations
pnpm nx run kaggle-data-api:migrate

# 4. Load sample data
pnpm nx run kaggle-data-api:etl-load --date 20241025

# 5. Start API
pnpm nx serve kaggle-data-api

# 6. Test API
curl http://localhost:3000/health
curl http://localhost:3000/v1/products
```

### Testing

```bash
# Run all tests
pnpm nx test kaggle-data-api

# Watch mode
pnpm nx test kaggle-data-api --watch

# Coverage
pnpm nx test kaggle-data-api --coverage
```

### Deployment

```bash
# Build image
docker build -t kaggle-data-api:latest .

# Deploy to local k8s
helm install kaggle-data-api ./helm/kaggle-data-api \
  -f helm/kaggle-data-api/values-dev.yaml
```

## Resources

### External Documentation

- [Fastify Docs](https://fastify.dev)
- [Kysely Docs](https://kysely.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Helm Docs](https://helm.sh/docs/)

### Project Documentation

- [Main README](../README.md)
- [Development Guide](../DEVELOPMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Guide](../ARCHITECTURE.md)

### Dataset Information

- **Source**: [Israeli Supermarkets 2024](https://www.kaggle.com/datasets/erlichsefi/israeli-supermarkets-2024)
- **Description**: Supermarket pricing data from major Israeli chains
- **Update Frequency**: Daily
- **Size**: ~15,000 products, ~50 stores

## FAQ

### Q: Why PostgreSQL instead of NoSQL?

**A**: The dataset is highly relational (stores ↔ products ↔ prices). PostgreSQL provides ACID guarantees, powerful query capabilities, and excellent performance for this use case.

### Q: Why Kysely instead of Prisma?

**A**: Kysely is type-safe, lightweight, SQL-first, and gives full control over queries. This is important for complex analytics queries and performance optimization.

### Q: Do we need Redis caching?

**A**: Not initially. Start with PostgreSQL only. Add Redis in Phase 3+ if performance metrics show caching would help.

### Q: How do we handle data updates?

**A**: The fetch-kaggle job runs daily, downloads new data, and triggers the ETL pipeline to update the database. Updates are additive (new price observations) with upserts for products/stores.

### Q: What about real-time data?

**A**: Out of scope for v1. The API serves batch-updated data (daily). Real-time updates would require a different architecture (streaming, event-driven).

### Q: How do we scale this?

**A**: Horizontal scaling via HPA (Kubernetes autoscaler). Database read replicas if needed. Redis caching for hot data. Consider materialized views for heavy analytics.

### Q: What's the expected load?

**A**: Start conservative (100 req/sec target). Monitor and scale as needed. Most queries should be <200ms with proper indexing.

---

**Document Version**: 1.0.0
**Last Updated**: 2024-10-26
**Status**: Ready for Implementation
**Related Documents**:

- [ARCHITECTURE.md](./KAGGLE-DATA-API-ARCHITECTURE.md)
- [PLAN.md](./KAGGLE-DATA-API-PLAN.md)
- [Helm Chart README](../helm/kaggle-data-api/README.md)
