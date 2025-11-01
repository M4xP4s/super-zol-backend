# AI Engineer x Grocery Optimization Roadmap (Part 2: Projects 3-7)

Continuation of the Smart Grocery Optimizer roadmap, building on Projects 1-2 to deliver
price intelligence, LLM-driven cart optimization, agents, automation, and governance.

## 0. Context Recap

- **Prerequisites:** Completed Projects 1-2 (normalized catalog, similarity service).
- **Objective:** Transform the clean data layer into user-facing intelligence and
  production-grade operations, keeping alignment with the _AI Engineer Syllabus_.
- **Shared Tooling:** FastAPI microservices, pgvector/PostgreSQL, Redis cache, n8n for
  orchestration, Prometheus + Grafana for telemetry.

---

## 3. Project #3 -- Price Intelligence Engine

### Topics Covered

- ML Foundations, Model Reasoning, Automation / n8n (_AI_Engineer_Syllabus.pdf p.10-12_).

### Dependencies

- Data pipeline (Project 1) for canonical price history.
- Similarity service (Project 2) for substitution-aware baskets.

### Success Criteria

- Store leaderboard MAE <=3 NIS versus verified receipts.
- Basket comparison endpoint <500 ms p95 response.
- Automated n8n daily run achieves >=98% success rate with retry budget.

### Risks & Mitigations

- **Anomalous price spikes:** implement z-score / IQR outlier filters, escalate
  discrepancies to moderation queue.
- **Temporal drift (holidays, inflation):** incorporate time-series features with decay,
  retrain weekly, keep backtesting log.
- **Workflow brittleness:** use n8n error workflows + dead-letter queue for failed jobs.

### Phases & Key TODOs

#### Phase 1 -- Basket Intelligence Core

- Define `Basket` schema, including substitution sets and quantity normalization.
- Build aggregation engine (Python + Pandas/Polars) with pytest coverage.
- Implement regression and gradient boosting models (CatBoost/XGBoost) to forecast near-term
  price movements; log metrics to Weights & Biases.

#### Phase 2 -- API & Automation

- Expose `/baskets/compare` and `/stores/leaderboard` endpoints with FastAPI.
- Create n8n workflow: ingest latest prices -> compute leaderboard -> publish to storage +
  notifications.
- Add caching for hot baskets (Redis) with TTL tied to data freshness.

#### Phase 3 -- Monitoring & Reporting

- Build dashboard summarizing savings opportunities per chain/city.
- Add alerting for regression drift (>5 pp drop in accuracy).
- Generate weekly PDF/Markdown report stored in `docs/reports/price-intelligence/`.

### Deliverables

- `services/price-intel/src/` with prediction and API modules.
- n8n workflow exports under `jobs/price-intel/`.
- Scheduled reporting scripts (`scripts/price-report.ts` or `.py`).

### Learning Outcomes

- Practice ML model lifecycle management with validation and monitoring.
- Learn to orchestrate analytics outputs using low-code automation.
- Bridge statistical outputs to actionable dashboards and alerts.

### Metrics & Instrumentation

- `basket_compare_latency_ms`, `leaderboard_mae`, `n8n_run_success_ratio`.
- Alert if MAE exceeds target for two consecutive runs.

---

## 4. Project #4 -- Smart Cart Optimizer (LLM + RAG)

### Topics Covered

- Applied LLM Engineering, Prompt Engineering, NLP + RAG (_AI_Engineer_Syllabus.pdf p.11-12_).

### Dependencies

- Price Intelligence outputs (Project 3) for latest store totals.
- Similarity service (Project 2) for substitute suggestions.
- MCP client/server scaffolding for structured responses.

### Success Criteria

- > =80% of evaluation prompts produce budget-compliant carts with verified availability.
- JSON Schema validation pass rate >=99% for MCP responses.
- Median response latency <2 s with streaming enabled.

### Risks & Mitigations

- **Hallucinated products:** enforce grounding via retrieval tool and chain-of-thought
  verification; reject responses lacking product IDs.
- **Token overruns:** introduce summarization of long baskets, cap reasoning steps.
- **Context staleness:** include dataset version + timestamp in every prompt header.

### Phases & Key TODOs

#### Phase 1 -- Prompt & Tool Design

- Define intents (budget optimize, dietary constraints, "what-if" substitutions).
- Build prompt templates with structured guidelines (system -> planner -> critic).
- Create synthetic evaluation set covering Hebrew/English mixed requests.

#### Phase 2 -- Implementation

- Develop MCP server exposing tools: `lookup_prices`, `find_substitutes`, `apply_promos`.
- Coordinate with LangChain/LlamaIndex agent for RAG retrieval.
- Add deterministic fallback path when LLM confidence < threshold.

#### Phase 3 -- Validation & UX

- Construct Vitest/Playwright API harness to replay evaluation prompts nightly.
- Capture user feedback ratings + track satisfaction metrics in analytics table.
- Produce demo CLI (`pnpm nx run smart-cart:demo`) for stakeholders.

### Deliverables

- `services/smart-cart/src/` MCP server + orchestrator logic.
- Prompt library under `docs/prompts/smart-cart/`.
- Evaluation scripts & scorecards (`tests/smart-cart/evals/`).

### Learning Outcomes

- Build production-grade LLM workflow with tool calling, retries, and evaluation.
- Understand how RAG foundations amplify LLM accuracy and cost efficiency.

### Metrics & Instrumentation

- `llm_token_usage`, `cart_success_ratio`, `fallback_rate`, `user_satisfaction_score`.
- Alert on hallucination detection >5% of responses.

---

## 5. Project #5 -- Multi-Store Optimizer Agent

### Topics Covered

- AI Agents, Applied LLM Engineering, Reasoning & Ethics
  (_AI_Engineer_Syllabus.pdf p.11-13_).

### Dependencies

- Projects 1-4 services (data, similarity, price intelligence, cart optimizer).
- Optional hooks into Project 6 notifications for follow-up actions.

### Success Criteria

- Agent completes >=90% of scripted household scenarios (multi-hop queries) autonomously.
- Average savings recommendation >=10% compared to baseline cart.
- Tool call error rate <3% over 7-day rolling window.

### Risks & Mitigations

- **Tool failure loops:** implement guard rails--task depth limit, circuit breaker, and
  recovery prompts.
- **Conflicting objectives (e.g., cheapest vs. fastest):** enforce explicit goal hierarchy,
  ask clarification questions.
- **Ethical drift:** embed transparency statements + user override for recommendations.

### Phases & Key TODOs

#### Phase 1 -- Architecture & Memory

- Design episodic + long-term memory stores (Redis + Postgres).
- Implement planner-executor architecture with MCP interface.
- Add conversation schema with redaction of PII prior to persistence.

#### Phase 2 -- Tooling & Decision Logic

- Integrate price comparisons, promo data, delivery ETA, and store distance APIs.
- Encode decision matrix (price vs. travel vs. dietary) with weighted scoring.
- Write unit tests for decision heuristics + conflict resolution.

#### Phase 3 -- Evaluation & Governance

- Build conversation simulator for 50 canonical scenarios.
- Conduct ethics review: fairness, bias detection, consent management.
- Output explanation layer ("why this suggestion") for each action.

### Deliverables

- `services/multi-store-agent/src/` with planner, tools, memory modules.
- Scenario harness under `tests/multi-store-agent/`.
- Policy doc `docs/ethics/multi-store-agent.md`.

### Learning Outcomes

- Master orchestrating multi-step agents with state, memory, and reasoning.
- Embed ethical considerations into AI decision systems.

### Metrics & Instrumentation

- `agent_task_success_ratio`, `average_savings_pct`, `tool_error_rate`, `ethics_flags`.
- Alert on savings drop below threshold or ethics flags >0.

---

## 6. Project #6 -- Promo Watcher & Notifier

### Topics Covered

- Automation / n8n, Infrastructure & Deployment, Prompt Engineering for summaries
  (_AI_Engineer_Syllabus.pdf p.12-13_).

### Dependencies

- Projects 1 & 3 for canonical price and promo deltas.
- Optional connection to Projects 4-5 for personalized messaging.

### Success Criteria

- Cron-driven workflows execute within +/-2 minutes of schedule.
- Alert precision >=85% (price drop threshold validated against truth set).
- Opt-out or preference update flows complete <1 minute end-to-end.

### Risks & Mitigations

- **Notification fatigue:** implement daily caps + personalized relevance scoring.
- **n8n node outages:** configure retries, alert on failure, and maintain DLQ.
- **Compliance (consent):** log consent state changes with immutable audit trail.

### Phases & Key TODOs

#### Phase 1 -- Workflow Design

- Map triggers (cron, webhook) and data sources (promos, price deltas).
- Create user preference schema (channels, products, thresholds).
- Draft LLM summarization prompts for message personalization.

#### Phase 2 -- Implementation

- Build n8n workflows plus local Docker setup (`docker-compose.n8n.yml`).
- Integrate communication channels (Telegram bot, email service).
- Write integration tests with mocked webhook payloads.

#### Phase 3 -- Monitoring & Control

- Deploy Prometheus exporter for n8n (job success, queue size).
- Add rate limiting + per-user alert counters.
- Produce retention & engagement dashboards.

### Deliverables

- `jobs/promo-watcher/` n8n workflows + scripts.
- Preference management API module (`services/preferences/`).
- Notification templates + prompt docs.

### Learning Outcomes

- Operationalize AI insights through automation.
- Manage user preferences, rate limits, and consent at scale.

### Metrics & Instrumentation

- `alerts_sent_total`, `alert_precision`, `opt_out_latency_ms`, `workflow_retry_count`.
- Alert when opt-outs exceed 10% in a day or precision drops below target.

---

## 7. Project #7 -- Ethics, Compliance & Production Deployment

### Topics Covered

- Infrastructure & Deployment, Reasoning & Ethics, Observability
  (_AI_Engineer_Syllabus.pdf p.12-13_).

### Dependencies

- All previous services exposing health checks, structured logs, and metrics.

### Success Criteria

- Availability SLO >=99.5% across public APIs.
- PII detection coverage 100% with automated redaction prior to storage.
- Incident response runbook tested via tabletop exercise once per quarter.

### Risks & Mitigations

- **Configuration drift:** GitOps + policy-as-code (Open Policy Agent) enforced in CI.
- **Security vulnerabilities:** scheduled dependency scanning + container image signing.
- **Ethical blind spots:** quarterly review board with documented decisions.

### Phases & Key TODOs

#### Phase 1 -- Governance Framework

- Document data retention policy and privacy impact assessment.
- Establish risk register and severity matrix (S0-S3).
- Define metrics + alert thresholds for SLO compliance.

#### Phase 2 -- Platform Hardening

- Implement infrastructure-as-code (Terraform/Pulumi) with environment parity.
- Add centralized secrets management (Vault or SSM) and rotation schedule.
- Configure centralized logging with PII scrubber and retention policy.

#### Phase 3 -- Operational Excellence

- Set up incident response runbook and on-call rotation.
- Integrate synthetic monitoring (checkers hitting critical APIs).
- Conduct chaos drills (e.g., simulate upstream chain outage) and capture lessons.

### Deliverables

- `docs/governance/` (risk register, privacy assessment, runbooks).
- IaC repo section (`infra/terraform/` or similar).
- Monitoring dashboards + alert definitions versioned in repo.

### Learning Outcomes

- Ship AI systems with compliance, reliability, and observability at their core.
- Translate syllabus ethics guidance into actionable guardrails.

### Metrics & Instrumentation

- `availability_slo`, `incident_mttr_minutes`, `pii_filter_hits`, `security_scan_failures`.
- Alert on MTTR > target or repeated PII hits.

---

With Projects 1-7 specified across Parts 1 & 2, the roadmap now provides end-to-end
guidance--from ingestion to ethics--for building the Smart Grocery Optimizer portfolio.
