# AI Engineer x Grocery Optimization Roadmap (Part 1: Projects 1-2)

This document deep-dives the first two projects in the Personalized Smart Grocery
Optimizer program, aligning hands-on deliverables with the _AI Engineer Syllabus_ to build
momentum toward production-ready AI services.

## 0. Overview

- **Objective:** unlock reliable grocery intelligence while exercising Python, ML, NLP, and
  infrastructure skills.
- **Scope:** Projects 1-2 in detail; Part 2 covers Projects 3-7.
- **Dataset:** Israeli Supermarkets 2024 (~200 price/promo/store files, daily refresh).
- **Dependencies:** Kaggle export + repo scaffolding under `services/` and `jobs/`.

## 1. Syllabus Alignment

| Syllabus Module (AI_Engineer_Syllabus.pdf p.10-13) | Project Leverage | Practical Outcome                                  |
| -------------------------------------------------- | ---------------- | -------------------------------------------------- |
| **Python Essentials**                              | 1                | Deterministic CSV ingestion & schema validation    |
| **ML Foundations**                                 | 1                | Feature-ready datasets + anomaly detection         |
| **Infrastructure & Deployment**                    | 1                | Dockerized FastAPI ETL with monitoring             |
| **NLP + RAG**                                      | 2                | Tokenization + embeddings for multilingual catalog |
| **Prompt Engineering**                             | 2                | LLM-based validation of semantic matches           |

---

## 2. Project #1 -- Data Normalization & Pipeline Service

### Topics Covered

- Python Essentials, ML Foundations, Infrastructure & Deployment,
  Spec/TDD discipline (_AI_Engineer_Syllabus.pdf p.10-12_).

### Dependencies

- Access to raw Kaggle dumps
- Repository FastAPI scaffolding (or create within project)

### Success Criteria

- Schema validation suite passes for every chain (>99% row acceptance).
- Daily ETL (full + incremental) completes <45 minutes on commodity hardware.
- REST endpoints (`/products`, `/stores`, `/prices`) respond <200 ms p95.

### Risks & Mitigations

- **Encoding variance (UTF-8 vs Windows-1255):** enforce decoding strategy + regression
  tests with fixture files.
- **Schema drift from chains:** contract test per chain file; alert on new columns.
- **Large file spikes:** stream ingestion with chunked readers to avoid memory blow-ups.

### Phases & Key TODOs

#### Phase 1 -- Foundation Build

- Spec canonical models for `Product`, `Store`, `PriceRecord`, `Promo`.
- Implement parsers with dataclass validation + pytest fixtures per chain.
- Normalize units (grams <-> liters) with explicit conversion table.
- Establish Optuna-based anomaly detection for price spikes (flag >4sigma).

#### Phase 2 -- Integration Layer

- FastAPI endpoints with pagination/filters (`chain`, `city`, `category`).
- Async ingestion job triggered via CLI + `nx run` scheduler.
- PostgreSQL + pgvector-ready schema (anticipates Project 2).
- Contract tests using `httpx.AsyncClient` + snapshot assertions.

#### Phase 3 -- Production Deployment

- Dockerfile + docker-compose profile `grocery-data`.
- Observability: Prometheus metrics (`ingestion_lag_seconds`, `records_ingested_total`),
  structured logging, Grafana dashboard.
- CI workflow `.github/workflows/validate_data.yml` covering linters, tests, and schema
  diff check.

### Deliverables

- `services/data-pipeline/src/` with ingestion + API modules.
- `tests/services/data-pipeline/` covering schema + API contracts.
- Grafana dashboard screenshot and runbook (`docs/ops/data-pipeline.md`).

### Learning Outcomes

- Practice strict typing, modular ETL design, observability-first deployments.
- Gain familiarity with CI, Docker, and Nx automation for data services.

### Metrics & Instrumentation

- Track `ingestion_duration_seconds`, `records_rejected_total`, `api_latency_ms`.
- Alert when rejection rate >1% or ingestion exceeds SLA window.

---

## 3. Project #2 -- Similar-Product Finder (Embedding-Based)

### Topics Covered

- NLP fundamentals, embeddings, RAG architecture, prompt-assisted evaluation
  (_AI_Engineer_Syllabus.pdf p.11-12_).

### Dependencies

- Clean catalog tables and product IDs from Project 1.
- Vector-friendly database (pgvector) or FAISS index container.

### Success Criteria

- Cosine similarity >=0.90 for validated equivalent pairs, <=0.40 for negatives.
- Batch inference handles >=100 k products in <30 minutes.
- Manual evaluation pool reports >=90% "acceptable" substitutions.

### Risks & Mitigations

- **Multilingual/abbreviated names:** normalization pipeline with transliteration,
  stop-word removal, and brand whitelist tests.
- **Embedding drift:** nightly evaluation job + model registry for version tracking.
- **LLM validation cost:** use cached, batched judge prompts; fall back to heuristic
  thresholds for bulk operations.

### Phases & Key TODOs

#### Phase 1 -- Foundation (Offline Model)

- Build unique product corpus with dedupe heuristics; persist to parquet.
- Train/test multilingual SBERT or USE; compare against FastText baseline.
- Benchmark similarity thresholds using curated positive/negative sets.

#### Phase 2 -- Vector Service

- Stand up pgvector-backed endpoint `/similar`.
- Implement caching (Redis) with TTL tuned to data refresh cadence.
- Ensure API returns structured metadata (product ID, chain, price delta).
- Add load tests (`k6` or `autocannon`) to guarantee <150 ms p95.

#### Phase 3 -- Evaluation & Prompt Tuning

- Create Claude/OpenAI prompt for semantic equivalence judgement.
- Store evaluation artefacts in `reports/similarity/`.
- Automate weekly QA run via Nx target + CI badge.

### Deliverables

- `services/similarity-api/src/` with vector index + FastAPI routes.
- Evaluation notebooks + scorecards under `docs/research/similarity/`.
- Demo script `scripts/demo-similar.sh` (curl-based showcase).

### Learning Outcomes

- Build and deploy multilingual embedding search.
- Blend deterministic heuristics with LLM-based evaluation safely.
- Prepare ground truth datasets for future agent reasoning steps.

### Metrics & Instrumentation

- Export `similarity_requests_total`, `cache_hit_ratio`, `llm_judge_latency_ms`.
- Alert on precision drop (>5 pp) or cache miss spikes.

---

Continue with `CURSOR_BRAINSOTRM_2.md` for Projects 3-7 (price intelligence, cart
optimization, agents, automation, and ethics).
