# AI Engineering + Grocery Optimization: Consolidated Master Plan

## Executive Summary

This plan consolidates the Claude and Cursor roadmaps into **3 comprehensive projects** that cover all AI Engineer Syllabus topics while building production-ready grocery intelligence tools for Israeli consumers and retailers.

**Core Dataset**: Israeli Supermarkets 2024 Kaggle dataset (~6.7GB, 37.9M+ rows, 40+ chains, Hebrew/English multilingual)

**Timeline**: 18-24 weeks total (6-8 weeks per project)

**Outcome**: Production-ready AI system saving households 15-25% on groceries while providing retail intelligence and automation.

## Planning Canvas

- **Scope**: Three production-grade workstreams (data foundation, conversational intelligence, automation/governance) mapped directly to AI Engineering syllabus competencies.
- **Out of Scope**: Payment processing, loyalty integrations, on-prem retailer deployments, and features lacking data backing (until validated via `docs/BRAINSTORM.md`).
- **Assumptions**: Dedicated squad of 3–4 AI engineers, cloud budget for prototyping, access to Kaggle dataset updates every 24 hours, approval to process pseudonymized receipt data.
- **Constraints**: Coverage targets (≥90% test coverage, <200 ms latency), bilingual support, adherence to privacy guardrails, and weekly stakeholder demos.
- **Guardrails**: Follow Nx project boundaries, update CHANGELOG + ADRs per milestone, keep WIP <7 tasks (see `docs/TODO.md` dashboard).

## Project Overview

### Project 1: Smart Grocery Intelligence Platform

**Duration**: 6-8 weeks
**Purpose**: Build the data foundation and ML/NLP intelligence layer that powers all downstream services.

#### Timeline at a Glance

| Week | Milestone                                      | Dependencies                     |
| ---- | ---------------------------------------------- | -------------------------------- |
| 0    | Environment + access finalized                 | Kaggle credentials, infra budget |
| 1    | ETL MVP for 3 chains                           | Dockerized stack, schema draft   |
| 2    | Streaming + validation complete                | Parser fixtures                  |
| 3    | Similarity + classification pipelines deployed | Labeled pairs, taxonomy          |
| 4    | Price intelligence APIs live                   | Forecast features, Redis cache   |
| 5    | Test/infra hardening, monitoring baseline      | CI runners, Grafana              |
| 6    | Project review + handoff to Project 2          | Documentation, metrics snapshot  |

### Project 2: Conversational Shopping Assistant

**Duration**: 6-8 weeks
**Purpose**: Create multimodal, conversational AI experiences for consumers with RAG and agent capabilities.

#### Timeline at a Glance

| Week | Milestone                                      | Dependencies                       |
| ---- | ---------------------------------------------- | ---------------------------------- |
| 6    | Handoff from Project 1 + vector store snapshot | Stable APIs, embeddings            |
| 7    | RAG core + retrieval evaluation                | Vector store, price data           |
| 8    | OCR receipt ingestion benchmarked              | Receipt dataset, OCR vendor access |
| 9    | Voice interface alpha with WER measurements    | ASR model selection                |
| 10   | Agent orchestration, tool-calling stable       | RAG endpoints, price compare APIs  |
| 11   | User testing loop + telemetry baseline         | Beta user cohort                   |
| 12   | Production readiness review                    | Runbooks, alerts                   |

### Project 3: Automated Budget Optimizer

**Duration**: 6-8 weeks
**Purpose**: Deploy production automation, monitoring, and ethical governance for scalable operations.

#### Timeline at a Glance

| Week | Milestone                                 | Dependencies                   |
| ---- | ----------------------------------------- | ------------------------------ |
| 12   | Project 2 handoff + ops backlog grooming  | Assistant telemetry, alerts    |
| 13   | n8n workflow scaffolding + scheduler      | Infra cluster, credentials     |
| 14   | Monitoring stack live with SLOs           | Prometheus/Grafana infra       |
| 15   | Budget assistant memory + personalization | Secure storage, consent model  |
| 16   | Ethics & governance tooling integrated    | Policy templates, legal review |
| 17   | Load/chaos testing + failover drills      | Staging cluster                |
| 18   | Production cutover & playbook sign-off    | All QA gates, compliance       |

## Syllabus Coverage Matrix

| AI Engineer Module          | Project 1   | Project 2   | Project 3   |
| --------------------------- | ----------- | ----------- | ----------- |
| Python Essentials           | ✅ Heavy    | ✅ Moderate | ✅ Light    |
| ML Foundations              | ✅ Heavy    | ✅ Light    | ✅ Moderate |
| NLP + RAG                   | ✅ Heavy    | ✅ Heavy    | ✅ Light    |
| LLM Integration             | ✅ Light    | ✅ Heavy    | ✅ Moderate |
| Prompt Engineering          | ✅ Light    | ✅ Heavy    | ✅ Moderate |
| AI Agents                   | ❌          | ✅ Heavy    | ✅ Moderate |
| Applied LLM Engineering     | ✅ Light    | ✅ Heavy    | ✅ Heavy    |
| Infrastructure & Deployment | ✅ Heavy    | ✅ Moderate | ✅ Heavy    |
| Automation / n8n            | ✅ Light    | ✅ Moderate | ✅ Heavy    |
| Model Reasoning             | ✅ Moderate | ✅ Heavy    | ✅ Heavy    |
| Ethics & Compliance         | ✅ Light    | ✅ Moderate | ✅ Heavy    |

---

## Project 1: Smart Grocery Intelligence Platform

### Value Proposition

- Normalize and enrich 37.9M+ product records for reliable analysis
- Enable 15-25% household savings through price comparison
- Provide real-time market intelligence for retailers

### Core Components

#### 1.1 Data Foundation Service

- **Tech Stack**: Python, FastAPI, PostgreSQL, pgvector, Docker
- **Features**:
  - Robust ETL pipeline handling UTF-8/Windows-1255 encodings
  - Schema validation for 40+ chain formats
  - Streaming ingestion (>1M rows/min)
  - Anomaly detection (price spikes >4σ)
  - REST APIs with <200ms p95 latency

#### 1.2 Similarity & Classification Engine

- **Tech Stack**: SBERT, XGBoost, LightGBM, FAISS/pgvector
- **Features**:
  - Multilingual product embeddings (Hebrew/English)
  - Auto-categorization of 100K+ products
  - Cross-brand product matching (>90% precision)
  - Price-aware recommendation system
  - Batch inference for catalog updates

#### 1.3 Price Intelligence Engine

- **Tech Stack**: CatBoost, Prophet, Pandas/Polars, Redis
- **Features**:
  - Store price comparison with MAE ≤3 NIS
  - Basket optimization algorithms
  - Promotion effectiveness tracking
  - Inflation trend analysis
  - Time-series forecasting (4-week horizon, MAPE <4%)

### Success Metrics

- Data ingestion <45 min daily with >99% validation
- API latency <200ms p95
- Classification accuracy ≥85%, macro F1 ≥0.8
- Price forecast MAPE <4%
- System availability ≥99.5%

**Measurement Plan**

| Metric             | Owner            | Data Source                    | Review Cadence     |
| ------------------ | ---------------- | ------------------------------ | ------------------ |
| Ingestion duration | Data Engineering | Airflow/n8n run logs           | Weekly demo        |
| API latency p95    | Platform         | Grafana dashboard (Prometheus) | Daily standup      |
| Classification F1  | ML/NLP           | Evaluation pipeline artifact   | Sprint review      |
| Price MAPE         | Data Science     | Forecast backtest report       | Sprint review      |
| Availability       | Platform         | Uptime robot / SLO dashboard   | Monthly ops review |

---

## Project 2: Conversational Shopping Assistant

### Value Proposition

- Natural language shopping interface in Hebrew/English
- Automated receipt processing saving ~50 NIS/month
- Personalized recommendations based on dietary preferences

### Core Components

#### 2.1 RAG-Powered Chat Interface

- **Tech Stack**: LangChain, Claude/OpenAI APIs, MCP architecture
- **Features**:
  - Context-aware product search
  - Multi-turn conversation memory
  - Tool-calling for price lookup, substitutions
  - Structured JSON responses
  - Hallucination detection (<5% rate)

#### 2.2 Multimodal Receipt Assistant

- **Tech Stack**: Vision APIs, OCR, n8n workflows
- **Features**:
  - Receipt image processing (>95% OCR accuracy)
  - Automatic discrepancy detection
  - Expense report generation
  - PII redaction before storage
  - Processing <1 minute per receipt

#### 2.3 Voice Shopping List Manager

- **Tech Stack**: Whisper/Deepgram, ASR, Intent classification
- **Features**:
  - Hands-free list creation
  - Multilingual support (Hebrew/English)
  - Quantity and brand extraction
  - Dietary preference memory
  - Word error rate <10%

#### 2.4 Multi-Store Optimizer Agent

- **Tech Stack**: LangChain Agents, ReAct pattern, Redis memory
- **Features**:
  - Multi-hop reasoning for complex queries
  - Store selection based on price/distance/availability
  - Average savings ≥10% vs baseline
  - Task completion ≥90% autonomously
  - Explainable recommendations

### Success Metrics

- LLM response <2s median
- Schema validation >99%
- User satisfaction ≥85%
- OCR accuracy ≥95%
- Agent task success ≥90%

**Measurement Plan**

| Metric                 | Owner    | Data Source               | Review Cadence |
| ---------------------- | -------- | ------------------------- | -------------- |
| LLM latency            | Platform | OpenTelemetry traces      | Weekly         |
| Schema validation rate | Platform | API validation logs       | Daily          |
| User satisfaction      | Product  | Beta feedback surveys     | Sprint review  |
| OCR accuracy           | ML/NLP   | Validation dataset report | Sprint review  |
| Agent success          | ML/NLP   | Autonomy harness metrics  | Weekly demo    |

---

## Project 3: Automated Budget Optimizer

### Value Proposition

- Fully automated operations with self-healing capabilities
- Personalized financial coaching saving households 20%+
- Enterprise-grade monitoring and compliance

### Core Components

#### 3.1 Workflow Automation Platform

- **Tech Stack**: n8n, Docker, Kubernetes, Terraform/Pulumi
- **Features**:
  - Daily price refresh workflows
  - Promotion alerts and notifications
  - Report generation pipelines
  - Webhook integrations
  - Retry logic and dead-letter queues

#### 3.2 Real-Time Operations Dashboard

- **Tech Stack**: Prometheus, Grafana, OpenTelemetry
- **Features**:
  - System health monitoring
  - Model drift detection
  - Consumer engagement metrics
  - SLO tracking (≥99.5% availability)
  - Alert-to-ack <5 minutes

#### 3.3 Budget Assistant with Memory

- **Tech Stack**: Agent framework, Postgres, encryption
- **Features**:
  - Financial goal planning
  - Spending pattern analysis
  - Personalized savings recommendations
  - Compliance guardrails
  - User-controlled data retention

#### 3.4 Ethics & Governance Layer

- **Tech Stack**: Policy-as-code, audit logging, PII scrubbers
- **Features**:
  - Automated PII detection/redaction
  - Fairness monitoring across demographics
  - Consent management system
  - Incident response playbooks
  - Quarterly ethics reviews

### Success Metrics

- Workflow success rate ≥98%
- MTTR <30 minutes
- Budget adherence improvement +15%
- Zero compliance incidents
- PII detection coverage 100%

**Measurement Plan**

| Metric                  | Owner        | Data Source            | Review Cadence      |
| ----------------------- | ------------ | ---------------------- | ------------------- |
| Workflow success        | Automation   | n8n run history        | Weekly              |
| MTTR                    | Platform     | Incident tracker       | Incident postmortem |
| Budget adherence uplift | Data Science | Cohort analysis report | Monthly             |
| Compliance incidents    | Compliance   | Audit log review       | Quarterly           |
| PII detection coverage  | Compliance   | DLP scan reports       | Sprint review       |

---

## Implementation Strategy

### Phase Distribution

**Weeks 1-8: Project 1 (Foundation)**

- Build reliable data pipeline
- Deploy ML models
- Establish API infrastructure

**Weeks 9-16: Project 2 (Intelligence)**

- Integrate LLMs and RAG
- Build conversational interfaces
- Deploy agent orchestration

**Weeks 17-24: Project 3 (Production)**

- Automate operations
- Implement monitoring
- Ensure compliance

### Execution Cadence (Solo Rhythm)

| Ritual             | Focus             | Agenda                                                       | Cadence  |
| ------------------ | ----------------- | ------------------------------------------------------------ | -------- |
| Daily Log          | Personal progress | Capture wins, blockers, risk changes in `logs/daily.md`      | Daily    |
| Weekly Review      | Demo & metrics    | Run key Nx tasks, update status dashboard, adjust priorities | Weekly   |
| Backlog Refinement | Grooming          | Promote/retire TODO.md items, size upcoming work             | Biweekly |
| Architecture Hour  | Deep thinking     | Update ADRs, review cross-cutting decisions                  | Biweekly |
| Ops Retro          | Reliability       | Inspect incidents, update runbooks, revisit guardrails       | Monthly  |

### Risk Register

| ID  | Risk                                        | Probability | Impact | Mitigation                                               | Contingency                                                |
| --- | ------------------------------------------- | ----------- | ------ | -------------------------------------------------------- | ---------------------------------------------------------- |
| R1  | Data quality regressions across chains      | Medium      | High   | Schema validation, anomaly alerts, manual QA queue       | Rollback to last green dataset, trigger incident review    |
| R2  | LLM tool-calling instability in Hebrew      | High        | Medium | Evaluate multiple providers, implement confidence gating | Fall back to template-based responses with escalation      |
| R3  | Scaling bottlenecks in ingestion            | Medium      | High   | Stress-test with Polars, horizontal workers, caching     | Enable backlog processing mode, pause non-critical jobs    |
| R4  | Privacy/compliance breach from receipt data | Low         | High   | Default PII redaction, consent tracking, access audits   | Suspend data processing, notify compliance/legal, run RCAs |
| R5  | Ops fatigue due to manual monitoring        | Medium      | Medium | Automate alerts, rotate on-call, maintain runbooks       | Engage backup rotation, defer feature work for tooling     |

### Success Criteria

**Technical**:

- 100% test coverage on critical paths
- <5% error rate across all services
- <2s response time for user-facing APIs

**Business**:

- 15-25% average household savings
- > 10K active users within 6 months
- > 85% user satisfaction rating

**Learning**:

- Complete coverage of AI Engineer Syllabus
- Production deployment experience
- Portfolio of 3 shippable products

---

## Technology Stack Summary

### Core Technologies

- **Languages**: Python 3.11+, TypeScript
- **Frameworks**: FastAPI, LangChain, n8n
- **Databases**: PostgreSQL, pgvector, Redis
- **ML/AI**: XGBoost, LightGBM, SBERT, Claude/OpenAI APIs
- **Infrastructure**: Docker, Kubernetes, Terraform
- **Monitoring**: Prometheus, Grafana, OpenTelemetry

### Development Tools

- **Testing**: Vitest, pytest, API harnesses
- **CI/CD**: GitHub Actions, Nx
- **Documentation**: Markdown, OpenAPI
- **Version Control**: Git with conventional commits

---

## Next Steps

1. Review and approve consolidated plan
2. Set up development environment
3. Begin Project 1 Phase 1 (Data Foundation)
4. Establish weekly progress reviews
5. Create project documentation structure

**Living Links**:

- Execution backlog: `docs/TODO.md`
- Strategic context & personas: `docs/BRAINSTORM.md`
- ADR index & architecture decisions: `docs/architecture/README.md`

---

## Appendix: Original Roadmap References

- **Claude Track**: Projects 1-10 focusing on customer experiences and ML services
- **Cursor Track**: Projects 1-7 building the Smart Grocery Optimizer
- **Consolidation Rationale**: Combined overlapping functionality, prioritized highest-value features, maintained full syllabus coverage

_This plan represents the synthesis of extensive planning work, optimized for maximum learning value and real-world impact._
