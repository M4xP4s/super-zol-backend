# Kaggle Data API Service - Implementation Plan

## Executive Summary

This document outlines the phased implementation plan for building a production-ready REST API service to serve Israeli Supermarkets 2024 Kaggle dataset. The implementation follows Test-Driven Development (TDD) methodology and Hexagonal Architecture patterns established in Epic 1.

**Timeline:** 6-8 weeks (estimated)
**Effort:** ~160-200 development hours
**Risk Level:** Medium
**Dependencies:** Completed Epic 1 (fetch-kaggle job)

## Table of Contents

- [Overview](#overview)
- [Pre-Implementation](#pre-implementation)
- [Phase 1: Foundation & Database](#phase-1-foundation--database)
- [Phase 2: Core API Development](#phase-2-core-api-development)
- [Phase 3: Advanced Features](#phase-3-advanced-features)
- [Phase 4: Production Deployment](#phase-4-production-deployment)
- [Testing Strategy](#testing-strategy)
- [Quality Gates](#quality-gates)
- [Risk Management](#risk-management)

## Overview

### Goals

1. ✅ Create REST API service to serve Kaggle dataset
2. ✅ Migrate data storage from job-local to shared storage
3. ✅ Implement ETL pipeline to load data into PostgreSQL
4. ✅ Deploy service with Helm to Kubernetes
5. ✅ Achieve 90%+ test coverage
6. ✅ Production-ready observability and monitoring

### Non-Goals (Out of Scope)

- ❌ Real-time data updates (scheduled batch updates only)
- ❌ User authentication system (API key only for Phase 1)
- ❌ Admin dashboard UI (API-only)
- ❌ Multi-tenancy support
- ❌ GraphQL endpoint (REST only)

### Success Criteria

| Metric                | Target       | Measurement                    |
| --------------------- | ------------ | ------------------------------ |
| **Test Coverage**     | ≥90%         | Vitest coverage report         |
| **API Response Time** | <200ms (p95) | Load testing                   |
| **Uptime**            | ≥99.5%       | Kubernetes monitoring          |
| **Documentation**     | 100%         | OpenAPI/Swagger completeness   |
| **Code Quality**      | A grade      | ESLint, TypeScript strict mode |

## Pre-Implementation

### Step 0.1: Data Storage Migration

**Goal:** Move Kaggle data from job-local storage to shared volume

**Tasks:**

1. **Update fetch-kaggle configuration**

   ```typescript
   // FROM:
   dataRoot: join(JOB_ROOT, 'data', 'kaggle_raw');

   // TO:
   dataRoot: process.env.KAGGLE_DATA_ROOT || '/data/kaggle/raw';
   ```

2. **Create shared directory structure**

   ```bash
   /data/
   └── kaggle/
       ├── raw/          # Raw CSV files from Kaggle
       ├── processed/    # Transformed/validated data
       └── archive/      # Historical backups
   ```

3. **Update Docker Compose**

   ```yaml
   volumes:
     - kaggle_data:/data/kaggle
   ```

4. **Update Kubernetes PVC**
   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: kaggle-data-pvc
   spec:
     accessModes:
       - ReadWriteMany
     resources:
       requests:
         storage: 10Gi
   ```

**Testing:**

- ✅ fetch-kaggle job writes to new location
- ✅ Multiple pods can read from shared volume
- ✅ Existing functionality unchanged

**Duration:** 2 days

---

### Step 0.2: Database Schema Design

**Goal:** Design and validate PostgreSQL schema

**Tasks:**

1. **Create migration framework**
   - Choose: node-pg-migrate or Kysely migrations
   - Set up migration runner
   - Create initial migration template

2. **Design schema (see ARCHITECTURE.md)**
   - Stores table
   - Products table
   - Prices table (fact table)
   - Dataset metadata table

3. **Create indexes**
   - Product name search indexes
   - Price query optimization indexes
   - Foreign key indexes

4. **Write migration tests**
   - Test migration up/down
   - Test constraints and validations
   - Test index creation

**Deliverables:**

- `migrations/001_initial_schema.sql`
- `migrations/002_indexes.sql`
- Migration runner script

**Duration:** 3 days

---

## Phase 1: Foundation & Database

**Duration:** 2 weeks
**Goal:** ETL pipeline + Database + Basic service skeleton

### Step 1.1: Generate API Service Skeleton

**Tasks:**

```bash
just gen-service kaggle-data-api
```

**Updates needed:**

- Add PostgreSQL dependencies
- Configure database connection
- Add Zod schemas
- Set up structured logging

**Files Created:**

```
services/kaggle-data-api/
├── src/
│   ├── main.ts
│   ├── app/
│   │   ├── app.ts
│   │   ├── plugins/
│   │   └── routes/
│   ├── core/
│   ├── adapters/
│   └── infrastructure/
└── tests/
```

**Testing:**

- ✅ Service starts successfully
- ✅ Health check endpoint works
- ✅ Basic test suite passes

**Duration:** 1 day

---

### Step 1.2: Database Connection & Repository Layer

**Tasks:**

1. **Create database connection module**

   ```typescript
   // src/infrastructure/database.ts
   import { Kysely, PostgresDialect } from 'kysely';
   import { Pool } from 'pg';

   export function createDatabase() {
     return new Kysely<Database>({
       dialect: new PostgresDialect({
         pool: new Pool({
           connectionString: process.env.DATABASE_URL,
         }),
       }),
     });
   }
   ```

2. **Define database types**

   ```typescript
   // src/infrastructure/database-types.ts
   export interface Database {
     stores: StoresTable;
     products: ProductsTable;
     prices: PricesTable;
     dataset_metadata: DatasetMetadataTable;
   }
   ```

3. **Implement base repository**

   ```typescript
   // src/adapters/outbound/postgres/base.repository.ts
   export abstract class BaseRepository {
     constructor(protected db: Kysely<Database>) {}
   }
   ```

4. **Create specific repositories**
   - `ProductRepository`
   - `StoreRepository`
   - `PriceRepository`

**Testing:**

- ✅ Connection pooling works
- ✅ Graceful shutdown closes connections
- ✅ Repository CRUD operations
- ✅ Transaction support

**Duration:** 3 days

---

### Step 1.3: ETL Pipeline Implementation

**Goal:** Load CSV data from fetch-kaggle into PostgreSQL

**Tasks:**

1. **Create ETL service**

   ```typescript
   // src/core/services/etl.service.ts
   export class ETLService {
     async loadDataset(date: string): Promise<LoadResult> {
       // 1. Read manifest.json
       // 2. Parse CSV files
       // 3. Transform data
       // 4. Load to database
     }
   }
   ```

2. **Implement CSV parser**
   - Read CSV in streaming fashion
   - Transform to domain entities
   - Validate data quality

3. **Implement data transformations**
   - Normalize store names
   - Deduplicate products
   - Calculate price statistics

4. **Implement database loader**
   - Batch inserts for performance
   - Upsert logic (update existing records)
   - Transaction management

5. **Create ETL CLI command**
   ```bash
   node dist/services/kaggle-data-api/main.js etl load --date 20241025
   ```

**Testing:**

- ✅ Parse sample CSV files
- ✅ Transform data correctly
- ✅ Load data to test database
- ✅ Handle duplicate records
- ✅ Rollback on errors

**Duration:** 5 days

---

### Step 1.4: Data Validation & Quality Checks

**Tasks:**

1. **Implement validation rules**
   - Price must be positive
   - Dates must be valid
   - Required fields present

2. **Data quality metrics**
   - Completeness (% of null values)
   - Uniqueness (duplicate detection)
   - Consistency (cross-field validation)

3. **ETL monitoring**
   - Records processed
   - Records failed
   - Processing time
   - Error details

**Testing:**

- ✅ Reject invalid data
- ✅ Report quality metrics
- ✅ Log validation errors

**Duration:** 2 days

---

## Phase 2: Core API Development

**Duration:** 2 weeks
**Goal:** Implement core REST endpoints with business logic

### Step 2.1: Domain Models & Value Objects

**Tasks:**

1. **Create domain entities**

   ```typescript
   // src/core/domain/entities/product.ts
   export class Product {
     constructor(
       public readonly id: number,
       public readonly kaggleProductId: string,
       public readonly name: string,
       public readonly category: string
       // ...
     ) {}
   }
   ```

2. **Create value objects**

   ```typescript
   // src/core/domain/value-objects/price-range.ts
   export class PriceRange {
     constructor(
       public readonly min: number,
       public readonly max: number
     ) {
       if (min > max) throw new Error('Invalid range');
     }
   }
   ```

3. **Define domain interfaces (ports)**
   - `ProductServicePort` (inbound)
   - `ProductRepositoryPort` (outbound)
   - `CachePort` (outbound)

**Testing:**

- ✅ Entity construction
- ✅ Value object validation
- ✅ Immutability guarantees

**Duration:** 2 days

---

### Step 2.2: Service Layer Implementation

**Tasks:**

1. **Implement ProductService**

   ```typescript
   export class ProductService implements ProductServicePort {
     async findById(id: number): Promise<Product | null> {
       // Check cache
       // Query repository
       // Transform to domain entity
     }

     async search(query: SearchQuery): Promise<Product[]> {
       // Build search criteria
       // Query repository
       // Return results
     }
   }
   ```

2. **Implement PriceService**
   - Get prices for product
   - Get price history
   - Calculate price trends

3. **Implement AnalyticsService**
   - Price comparison
   - Basket cost calculation
   - Store rankings

**Testing:**

- ✅ Mock repository layer
- ✅ Test business logic in isolation
- ✅ Edge cases (empty results, errors)

**Duration:** 4 days

---

### Step 2.3: REST API Routes

**Tasks:**

1. **Products endpoints**

   ```typescript
   // src/app/routes/products.ts
   export default async function (fastify: FastifyInstance) {
     fastify.get('/products', async (request, reply) => {
       const schema = ProductQuerySchema.parse(request.query);
       const result = await productService.search(schema);
       return { data: result };
     });
   }
   ```

2. **Prices endpoints**
   - `GET /prices` - List prices with filters
   - `GET /prices/trends` - Price trends

3. **Stores endpoints**
   - `GET /stores` - List stores
   - `GET /stores/:id/products` - Products in store

4. **Analytics endpoints**
   - `POST /analytics/basket-cost` - Calculate basket
   - `GET /analytics/price-comparison` - Compare prices

**Testing:**

- ✅ Integration tests (real HTTP calls)
- ✅ Schema validation
- ✅ Error handling (400, 404, 500)
- ✅ Pagination

**Duration:** 4 days

---

### Step 2.4: Input Validation & Error Handling

**Tasks:**

1. **Create Zod schemas**

   ```typescript
   // src/infrastructure/zod-schemas.ts
   export const ProductQuerySchema = z.object({
     page: z.number().min(1).default(1),
     per_page: z.number().min(1).max(100).default(20),
     category: z.string().optional(),
     search: z.string().optional(),
   });
   ```

2. **Global error handler**

   ```typescript
   fastify.setErrorHandler((error, request, reply) => {
     if (error instanceof z.ZodError) {
       reply.code(400).send({ error: formatZodError(error) });
     }
     // Handle other error types
   });
   ```

3. **Custom error types**
   - `NotFoundError`
   - `ValidationError`
   - `DatabaseError`

**Testing:**

- ✅ Invalid input rejected
- ✅ Proper error codes returned
- ✅ Error messages user-friendly

**Duration:** 2 days

---

## Phase 3: Advanced Features

**Duration:** 1.5 weeks
**Goal:** Performance, caching, and production features

### Step 3.1: Caching Layer (Optional)

**Tasks:**

1. **Redis integration**

   ```typescript
   // src/adapters/outbound/redis/cache.adapter.ts
   export class RedisCache implements CachePort {
     async get<T>(key: string): Promise<T | null> {
       const value = await this.redis.get(key);
       return value ? JSON.parse(value) : null;
     }
   }
   ```

2. **Cache strategy**
   - Cache frequently accessed products
   - Cache price summaries
   - TTL: 1 hour for most data

3. **Cache invalidation**
   - Invalidate on ETL load
   - LRU eviction policy

**Testing:**

- ✅ Cache hit/miss scenarios
- ✅ TTL expiration
- ✅ Fallback to database

**Duration:** 3 days

---

### Step 3.2: API Documentation

**Tasks:**

1. **OpenAPI/Swagger setup**

   ```typescript
   fastify.register(require('@fastify/swagger'), {
     openapi: {
       info: {
         title: 'Kaggle Data API',
         version: '1.0.0',
       },
     },
   });

   fastify.register(require('@fastify/swagger-ui'), {
     routePrefix: '/docs',
   });
   ```

2. **Document all endpoints**
   - Request/response schemas
   - Example requests
   - Error codes

3. **Generate OpenAPI spec**
   - Export as JSON
   - Version control

**Testing:**

- ✅ All endpoints documented
- ✅ Swagger UI accessible
- ✅ Try-it-out functionality works

**Duration:** 2 days

---

### Step 3.3: Rate Limiting & Security

**Tasks:**

1. **Rate limiting**

   ```typescript
   fastify.register(require('@fastify/rate-limit'), {
     max: 100,
     timeWindow: '1 minute',
   });
   ```

2. **API key authentication**

   ```typescript
   fastify.addHook('onRequest', async (request, reply) => {
     const apiKey = request.headers['x-api-key'];
     if (!validateApiKey(apiKey)) {
       reply.code(401).send({ error: 'Unauthorized' });
     }
   });
   ```

3. **Security headers**
   - Helmet plugin
   - CORS configuration
   - CSP policy

**Testing:**

- ✅ Rate limits enforced
- ✅ Invalid API keys rejected
- ✅ Security headers present

**Duration:** 2 days

---

### Step 3.4: Observability & Monitoring

**Tasks:**

1. **Structured logging**

   ```typescript
   logger.info(
     {
       request_id: request.id,
       method: request.method,
       url: request.url,
       duration: Date.now() - start,
     },
     'Request completed'
   );
   ```

2. **Metrics collection**
   - Prometheus metrics
   - Request duration
   - Error rates
   - Database query time

3. **Health checks**
   - Liveness probe
   - Readiness probe
   - Dependency checks

**Testing:**

- ✅ Logs are structured JSON
- ✅ Metrics are exported
- ✅ Health checks accurate

**Duration:** 2 days

---

## Phase 4: Production Deployment

**Duration:** 1.5 weeks
**Goal:** Helm charts, CI/CD, production deployment

### Step 4.1: Helm Chart Development

**Tasks:**

1. **Create Helm chart structure**

   ```bash
   helm create helm/kaggle-data-api
   ```

2. **Define chart templates**
   - `deployment.yaml`
   - `service.yaml`
   - `ingress.yaml`
   - `configmap.yaml`
   - `secret.yaml`
   - `hpa.yaml` (Horizontal Pod Autoscaler)
   - `pdb.yaml` (Pod Disruption Budget)

3. **Create values files**
   - `values.yaml` (default)
   - `values-dev.yaml`
   - `values-staging.yaml`
   - `values-production.yaml`

4. **Add PostgreSQL subchart**
   ```yaml
   # Chart.yaml
   dependencies:
     - name: postgresql
       version: 12.x.x
       repository: https://charts.bitnami.com/bitnami
   ```

**Testing:**

- ✅ Helm lint passes
- ✅ Dry-run succeeds
- ✅ Deploy to local k8s (minikube/kind)

**Duration:** 3 days

---

### Step 4.2: Container Image Optimization

**Tasks:**

1. **Multi-stage Dockerfile**
   - Build stage
   - Production stage
   - Layer caching optimization

2. **Image size optimization**
   - Use alpine base image
   - Remove dev dependencies
   - Target: <200MB image

3. **Security scanning**
   - Scan for vulnerabilities
   - Update base images

**Testing:**

- ✅ Image builds successfully
- ✅ Image runs in container
- ✅ No critical vulnerabilities

**Duration:** 2 days

---

### Step 4.3: CI/CD Pipeline

**Tasks:**

1. **GitHub Actions workflow**

   ```yaml
   # .github/workflows/kaggle-data-api.yml
   name: Kaggle Data API CI/CD

   on:
     push:
       branches: [main]
       paths:
         - 'services/kaggle-data-api/**'

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - run: pnpm install
         - run: pnpm nx test kaggle-data-api

     build:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: docker/build-push-action@v4
   ```

2. **Deployment automation**
   - Build Docker image
   - Push to registry
   - Deploy via Helm
   - Run smoke tests

**Testing:**

- ✅ CI passes on PR
- ✅ Image pushed to registry
- ✅ Deployment successful

**Duration:** 2 days

---

### Step 4.4: Production Deployment & Validation

**Tasks:**

1. **Deploy to staging**

   ```bash
   helm upgrade --install kaggle-data-api ./helm/kaggle-data-api \
     -f helm/kaggle-data-api/values-staging.yaml \
     --namespace super-zol-staging
   ```

2. **Run ETL on staging**
   - Load sample dataset
   - Verify data integrity
   - Test API endpoints

3. **Load testing**
   - Simulate 100 concurrent users
   - Measure response times
   - Identify bottlenecks

4. **Deploy to production**
   - Blue/green deployment
   - Monitor metrics
   - Rollback plan ready

**Testing:**

- ✅ API accessible via ingress
- ✅ Database queries fast (<200ms)
- ✅ No errors in logs
- ✅ Health checks passing

**Duration:** 3 days

---

## Testing Strategy

### Test Coverage Requirements

| Test Type             | Coverage Target | Tools                   |
| --------------------- | --------------- | ----------------------- |
| **Unit Tests**        | ≥95%            | Vitest                  |
| **Integration Tests** | ≥80%            | Vitest + Testcontainers |
| **E2E Tests**         | Critical paths  | Vitest + Fastify inject |
| **Load Tests**        | -               | k6 or Artillery         |

### Testing Pyramid

```
        /\
       /  \
      / E2E \          ~5% (Critical user flows)
     /------\
    /  Integ \         ~25% (API + DB interactions)
   /----------\
  /    Unit    \       ~70% (Business logic)
 /--------------\
```

### Test Examples

#### Unit Test

```typescript
// tests/unit/services/product.service.test.ts
describe('ProductService', () => {
  it('should find product by ID', async () => {
    const mockRepo = {
      findById: vi.fn().mockResolvedValue(mockProduct),
    };
    const service = new ProductService(mockRepo);

    const result = await service.findById(1);

    expect(result).toEqual(mockProduct);
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });
});
```

#### Integration Test

```typescript
// tests/integration/products.api.test.ts
describe('GET /products', () => {
  it('should return paginated products', async () => {
    // Setup: Insert test data
    await insertTestProducts(db);

    // Execute: Make API request
    const response = await fastify.inject({
      method: 'GET',
      url: '/products?page=1&per_page=10',
    });

    // Assert: Verify response
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(10);
  });
});
```

## Quality Gates

### Pre-Commit

- ✅ ESLint passes
- ✅ Prettier formatting
- ✅ TypeScript compiles

### Pre-Push

- ✅ All tests pass
- ✅ Coverage ≥90%
- ✅ Build succeeds

### Pre-Merge (CI)

- ✅ All checks pass
- ✅ No security vulnerabilities
- ✅ Documentation updated

### Pre-Deploy

- ✅ Integration tests pass
- ✅ Performance tests pass
- ✅ Database migrations succeed

## Risk Management

### Technical Risks

| Risk                         | Impact | Probability | Mitigation                                      |
| ---------------------------- | ------ | ----------- | ----------------------------------------------- |
| **Large dataset size**       | High   | Medium      | Streaming, pagination, indexing                 |
| **Complex queries slow**     | High   | Medium      | Query optimization, caching, materialized views |
| **ETL failures**             | Medium | Low         | Transaction rollback, retry logic, monitoring   |
| **Database migrations fail** | High   | Low         | Test migrations, backup before deploy           |

### Operational Risks

| Risk                  | Impact | Probability | Mitigation                                |
| --------------------- | ------ | ----------- | ----------------------------------------- |
| **Kubernetes issues** | High   | Low         | Multiple replicas, readiness probes, PDBs |
| **Database overload** | High   | Medium      | Connection pooling, query limits, caching |
| **API abuse**         | Medium | Medium      | Rate limiting, API keys, monitoring       |

## Definition of Done

A phase is considered complete when:

- ✅ All tasks implemented
- ✅ Tests written and passing (≥90% coverage)
- ✅ Code reviewed and approved
- ✅ Documentation updated
- ✅ Deployed to staging environment
- ✅ Acceptance criteria met
- ✅ No critical bugs
- ✅ Performance benchmarks met

## Timeline Summary

| Phase                  | Duration    | Deliverables                             |
| ---------------------- | ----------- | ---------------------------------------- |
| **Pre-Implementation** | 1 week      | Data migration, schema design            |
| **Phase 1**            | 2 weeks     | ETL pipeline, database, service skeleton |
| **Phase 2**            | 2 weeks     | Core API endpoints, business logic       |
| **Phase 3**            | 1.5 weeks   | Caching, docs, security, monitoring      |
| **Phase 4**            | 1.5 weeks   | Helm charts, CI/CD, production deploy    |
| **Total**              | **8 weeks** | Production-ready API service             |

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Create GitHub issues** for each task
3. **Set up project board** for tracking
4. **Start with Pre-Implementation** (data migration)
5. **Begin Phase 1** (foundation)

---

**Document Version:** 1.0.0
**Last Updated:** 2024-10-26
**Authors:** Claude Code Agent
**Status:** Draft - Ready for Review
**Related:** [KAGGLE-DATA-API-ARCHITECTURE.md](./KAGGLE-DATA-API-ARCHITECTURE.md)
