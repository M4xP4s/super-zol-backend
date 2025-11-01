# AI Engineering + Grocery Data: Project Brainstorm (Claude Track)

Curated plan for the first five Claude-led projects that transform the Israeli Supermarkets
2024 dataset into production-ready AI experiences. Projects 6-10 continue in
`BRAINSTORM-PROJECTS-6-10.md`.

## Executive Summary

- **Objective:** deliver customer-facing tools (agents, dashboards, multimodal assistants)
  while practising every module in the _AI Engineer Syllabus_ (AI_Engineer_Syllabus.pdf p.10-13).
- **Output:** five shippable products plus shared infrastructure, enabling rapid expansion
  into the remaining roadmap.
- **Value:** consumer savings, operational transparency for retailers, reusable AI
  components for future services.

## Dataset Snapshot -- Israeli Supermarkets 2024

- 6.4 GB of production-scale CSV/JSON exports covering prices, promotions, stores.
- 37.9 M+ rows, 40+ chains, refreshed daily (snapshot 2025-11-01).
- Multilingual (Hebrew/English), high-cardinality, includes temporal + geographic signals.
- Perfect for ETL -> embeddings -> RAG -> agent orchestration in a real economy context.

## Read This First

- **Roadmap shape:** Projects 1-5 (Claude track) focus on customer experiences; Projects
  6-10 add ML services, automation, and financial coaching.
- **Skill coverage:** Every syllabus module is exercised at least twice.
- **Suggested order:** Projects 1 -> 2 -> 5 for conversational UX, then 3 -> 4 for multimodal
  - infrastructure depth.
- **Learning paths:** Beginners can start with Project 1, while production-focused teams
  may jump to Project 4 after completing the data foundation in the Cursor roadmap.

## Reusable Validation & Tooling

Every project inherits the baseline suite below; only incremental checks are listed inside
each project capsule.

- [done] **Data ingestion:** encoding coverage (UTF-8 & Windows-1255), schema drift diffing,
  ability to stream >=1 M rows/min.
- [done] **API contracts:** JSON Schema validation, <200 ms p95 latency, pagination/filter tests.
- [done] **Security & privacy:** authz integration tests, rate limiting, PII redaction, secrets
  sourced from env/secret store.
- [done] **Observability:** Prometheus metrics, structured logs, Grafana dashboard or equivalent.
- [done] **CI/CD:** lint + unit + integration + deploy smoke tests via Nx targets.

---

## Project 1 -- Smart Grocery Price Comparison Agent

### Syllabus Alignment

- AI Agents, LLM Integration, Prompt Engineering, Applied LLM Engineering
  (_AI_Engineer_Syllabus.pdf p.11-12_).

### Value Proposition

- 15-25% household savings by surfacing cheaper alternatives in seconds.
- Personalised recommendations using location awareness and promotion data.

### Risks & Assumptions

- Requires normalized catalog + similarity service from Cursor Projects 1-2.
- Location sharing is opt-in; fallback copy provided when GPS disabled.
- Price feed jitter >5 minutes triggers degraded-mode messaging.

### Milestones

- **Phase 1 -- Foundation (Weeks 1-2):** design REST/MCP contract, implement
  multilingual normalization, stream ingestion into Postgres+pgvector, seed vector store.
- **Phase 2 -- Reasoning Core (Weeks 3-4):** build planner/executor with tool registry
  (`price_lookup`, `promo_lookup`, `similar_products`), craft CoT/ReAct prompt suites, add
  conversation memory with retention policies.
- **Phase 3 -- Production (Weeks 5-6):** Dockerize (<5 s cold start), introduce Redis cache
  (>70% hit rate), expose latency + token metrics, automate deployment pipeline.

### Success Metrics

- MAE <=3 NIS against receipt benchmarks, <2 s median response, >=80% satisfactory ratings.

### Additional Validation

- Synthetic dialogue harness covering ambiguous Hebrew/English prompts.
- Replay tests ensuring structured JSON matches MCP schema version.

---

## Project 2 -- RAG Promotion & Pricing Analyzer

### Syllabus Alignment

- Machine Learning, FastAPI, NLP + RAG, Model Evaluation
  (_AI_Engineer_Syllabus.pdf p.10-11_).

### Value Proposition

- 10-15% uplift in promotion ROI through trend analysis and forecasting.
- Retail-ready reports summarising seasonal offers and competitor moves.

### Risks & Assumptions

- Promotion feeds remain historically complete; data gaps flagged for manual backfill.
- Embedding costs managed via batching + caching; fall back to heuristics if API limits hit.
- Holiday spikes may skew models--time-aware features required.

### Milestones

- **Phase 1 -- Data & Features (Weeks 1-2):** normalise promotion schemas, enrich with
  seasonality features, persist taxonomy-ready tables, generate exploratory dashboards.
- **Phase 2 -- Retrieval + Forecast (Weeks 3-4):** train promotion probability models
  (CatBoost/XGBoost), index embeddings in FAISS or pgvector, assemble RAG pipeline for
  historical context and summarisation.
- **Phase 3 -- Delivery (Weeks 5-6):** expose `/analyze` & `/forecast` APIs, schedule daily
  n8n workflow to publish reports, deploy caching + async processing for batch workloads.

### Success Metrics

- Retrieval precision >=0.8 @ top-10, forecast MAE <=5 pp, report generation <15 minutes.

### Additional Validation

- SHAP/feature-importance notebooks kept up to date for explainability.
- Golden queries retained for regression testing across releases.

---

## Project 3 -- Multimodal Grocery Receipt Assistant

### Syllabus Alignment

- Multimodal AI, LLM Integration (vision), n8n Automation, AI Agents
  (_AI_Engineer_Syllabus.pdf p.11-12_).

### Value Proposition

- Automates receipt ingestion, detects overcharges (~NIS50/month saved), creates expense
  reports for households and SMBs.

### Risks & Assumptions

- Vision API quota sufficient; offline OCR fallback planned for outages.
- Image quality variance handled through preprocessing; reject flows documented for poor
  captures.
- Privacy safeguards enforced (PII blurring before storage).

### Milestones

- **Phase 1 -- Vision Pipeline (Weeks 1-2):** build upload validation, integrate vision/OCR,
  map line items to canonical products using similarity service.
- **Phase 2 -- Intelligence Layer (Weeks 3-4):** calculate discrepancies, apply promotion
  rules, generate structured expense summaries, leverage agents for multi-step reasoning.
- **Phase 3 -- Experience & Automation (Weeks 5-6):** wire n8n workflow for notifications,
  deliver web/mobile preview, export audited reports.

### Success Metrics

- OCR accuracy >=95%, discrepancy detection >90% recall, processing <1 minute per receipt.

### Additional Validation

- Vision regression suite with curated receipt corpus (day/night, crumpled, Hebrew/English).
- Security review ensuring images encrypted at rest and signed URL expiry <15 minutes.

---

## Project 4 -- Real-Time Grocery Ops Dashboard

### Syllabus Alignment

- Infrastructure & Deployment, Observability, Automation / n8n
  (_AI_Engineer_Syllabus.pdf p.12-13_).

### Value Proposition

- Single-pane visibility into ingestion health, model drift, consumer engagement.
- Enables ops teams to diagnose issues in minutes instead of hours.

### Risks & Assumptions

- Requires consistent metrics emission from all upstream services.
- Stakeholders agree on core KPIs (SLOs, savings, latency) early to avoid rework.
- Access control enforced; sensitive metrics gated behind auth.

### Milestones

- **Phase 1 -- Metrics Inventory (Weeks 1-2):** catalogue signals per service, define SLOs,
  create Terraform/Pulumi modules for dashboards.
- **Phase 2 -- Dashboard Build (Weeks 3-4):** implement Grafana panels, alert rules,
  incident webhooks, integrate automated runbooks.
- **Phase 3 -- Operations (Weeks 5-6):** schedule synthetic checks, implement on-call
  rotations, document escalation paths.

### Success Metrics

- Observability coverage >=95% of critical flows, alert-to-ack <5 minutes, MTTR <30 minutes.

### Additional Validation

- Chaos drills (e.g., disable price feed) with postmortem templates stored in repo.
- Access audits verifying least-privilege on dashboards and alert channels.

---

## Project 5 -- MCP Chatbot for Grocery Assistance

### Syllabus Alignment

- Applied LLM Engineering, MCP architecture, Prompt Engineering, Reasoning & Ethics
  (_AI_Engineer_Syllabus.pdf p.11-13_).

### Value Proposition

- Structured conversations across channels (web, messaging) with predictable schemas.
- Unlocks partner integrations where deterministic outputs are mandatory.

### Risks & Assumptions

- Tooling upstream (Projects 1-4) must expose health-checked endpoints.
- Compliance constraints (e.g., dietary/allergy advice) require curated knowledge base.
- Conversation logs must remain privacy-safe and redact PII automatically.

### Milestones

- **Phase 1 -- Contract Design (Weeks 1-2):** define MCP tools, JSON Schemas, and guardrail
  prompts; assemble intent library.
- **Phase 2 -- Implementation (Weeks 3-4):** build MCP server/client, orchestrate tool calls
  with retry & timeout policies, implement long-lived conversation memory.
- **Phase 3 -- Governance (Weeks 5-6):** add evaluation harness (BLEU/focused metrics +
  human review), integrate ethics checks, publish deployment + rollback playbooks.

### Success Metrics

- 99% schema validation pass rate, <5% hallucination detection, >=85% helpfulness scores.

### Additional Validation

- Monte-Carlo tool-failure simulations ensure graceful degradation.
- Audit trail maintained (conversation transcripts with action justifications).

---

## Next Steps

- Continue with `BRAINSTORM-PROJECTS-6-10.md` for advanced ML, automation, and financial
  coaching initiatives.
- Keep `CHANGELOG.md` updated as milestones close; reference project IDs for traceability.
