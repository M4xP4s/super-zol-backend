# Cursor Roadmap Overview -- AI Engineer x Grocery Optimization

This document frames the **Personalized Smart Grocery Optimizer** journey so the work
tracks directly to the _AI Engineer Syllabus_ while staying outcome-driven for Israeli
shoppers and retail partners.

## Dataset Snapshot

- **Source:** Israeli Supermarkets 2024 Kaggle dataset (~200 CSV/JSON assets, 6.7 GB+)
- **Refresh cadence:** Daily (4-hour scrapes per chain)
- **Modalities:** Tabular prices, promotions, store metadata, multilingual product text
- **Why it matters:** Combines structured, temporal, and text data--perfect coverage for
  ETL -> embeddings -> LLMs -> agents -> observability.

## Syllabus Coverage Map

| AI Engineer Module (AI_Engineer_Syllabus.pdf p.10-13) | Grocery Optimizer Opportunity | Anchor Project |
| ----------------------------------------------------- | ----------------------------- | -------------- |
| **Python Essentials**                                 | Robust ingestion & validation | 1              |
| **ML Foundations**                                    | Basket scoring & trend models | 1 - 3          |
| **NLP + RAG**                                         | Cross-brand product matching  | 2 - 4          |
| **Applied LLM Engineering**                           | Structured cart responses     | 4 - 5          |
| **Prompt Engineering**                                | Cart reasoning flows          | 4              |
| **Automation / n8n**                                  | Scheduled refresh + alerts    | 3 - 6          |
| **AI Agents**                                         | Multi-store negotiation agent | 5              |
| **Infrastructure & Deployment**                       | Containerized services + SLOs | 1 - 6 - 7      |
| **Reasoning & Ethics**                                | Transparent savings insights  | 5 - 7          |

## Delivery Sequencing (Recommended)

1. **Project 1** -- make the data reliable; unlocks everything else.
2. **Project 2** -- deliver semantic context for RAG and agent skills.
3. **Project 3** -- convert normalized data into price intelligence outputs.
4. **Project 4** -- layer natural-language cart optimization on top of 1-3.
5. **Project 5** -- orchestrate multi-step agents over the API suite.
6. **Project 6** -- automate refresh, alerts, and retention loops.
7. **Project 7** -- harden for production and ship compliance guardrails.

## Cross-Project Success Metrics

- **ETL health:** ingest daily drops <45 min with >99% schema validation pass rate.
- **Similarity quality:** multilingual product match precision >=90% @ top-3.
- **Basket intelligence:** store ranking MAE <=3 NIS compared to ground truth receipts.
- **Assistant UX:** <2 s median LLM response, >=80% "useful" rating in user testing.
- **Ops readiness:** 95th percentile workflow latency <10 s, critical alerts routed in
  <5 min, zero PII leaks in logged payloads.

## Project Capsules

### 1. Data Foundation & Normalization Service

- **Syllabus focus:** Python Essentials, Infrastructure & Deployment (AI_Engineer_Syllabus.pdf p.10-13)
- **Dependencies:** Kaggle raw dumps; no internal blockers.
- **Success criteria:** deterministic schemas for `Product`, `Store`, `PriceRecord`, `Promo`;
  daily ETL succeeds automatically; FastAPI endpoints hit <200 ms p95.
- **Risks & mitigations:** encoding variance -> enforce UTF-8 read with fallback tests;
  file-size spikes -> chunked ingestion + streaming validators.
- **Launch readiness:** CI schema checks, Docker image published, observability dashboards
  (`ingestion_lag`, `records_ingested`) alive before promoting to staging.

### 2. Similar-Product Finder (Embedding-Based)

- **Syllabus focus:** NLP + RAG, Prompt Engineering (AI_Engineer_Syllabus.pdf p.11-12)
- **Dependencies:** Clean product catalog and identifiers from Project 1.
- **Success criteria:** cosine similarity >0.9 for curated positive pairs, <0.4 for
  negatives; 500 k inference/sec sustained using pgvector or FAISS; human spot-check OKRs
  met weekly.
- **Risks & mitigations:** Hebrew diacritics + transliteration noise -> shared tokenizer +
  normalization unit tests; embedding drift -> scheduled evaluation set refresh.
- **Launch readiness:** `/similar` endpoint contract-tested, cache hit-rate >70%, LLM
  validator prompts stored in version control.

### 3. Price Intelligence Engine

- **Syllabus focus:** ML Foundations, Model Reasoning, Automation/n8n (AI_Engineer_Syllabus.pdf p.10-12)
- **Dependencies:** Projects 1-2 for trustworthy catalog and substitution graph.
- **Success criteria:** basket comparison latency <500 ms, leaderboard accuracy within 3 NIS,
  n8n daily leaderboard workflow success rate >=98%.
- **Risks & mitigations:** price anomalies -> z-score outlier detection prior to scoring;
  holiday-season volatility -> temporal features with decay windows.
- **Launch readiness:** regression tests for aggregation math, forecasting notebooks with
  clear retraining triggers, notifications wired to Slack/Telegram sandbox.

### 4. Smart Cart Optimizer (LLM + RAG)

- **Syllabus focus:** Applied LLM Engineering, Prompt Engineering (AI_Engineer_Syllabus.pdf p.11-12)
- **Dependencies:** Projects 1-3; relies on vector search and price APIs.
- **Success criteria:** 80%+ of eval prompts produce budget-compliant carts; structured MCP
  payloads validate against JSON Schema; hallucination rate <5% on adversarial prompts.
- **Risks & mitigations:** token overruns -> streaming summaries + tool-call limits;
  context staleness -> prompt guardrail referencing catalog version IDs.
- **Launch readiness:** prompt library in source control, replayable test harness (Vitest or
  Playwright API) covering primary intents, latency graph publicly visible.

### 5. Multi-Store Optimizer Agent

- **Syllabus focus:** AI Agents, Applied LLM Engineering, Model Reasoning (AI_Engineer_Syllabus.pdf p.11-12)
- **Dependencies:** Projects 1-4; optional enhancements from 6 for alerting.
- **Success criteria:** agent completes >=90% of scripted multi-hop tasks without human
  intervention; savings recommendations verified against baseline baskets; tool call error
  rate <3%.
- **Risks & mitigations:** infinite loops -> goal/task cap + heartbeat watchdog; partial data
  availability -> fallback strategies defined per chain.
- **Launch readiness:** conversation traces logged with PII scrubbers, contingency playbook
  for upstream outages, alignment review (ethics rubric) signed off.

### 6. Promo Watcher & Notifier

- **Syllabus focus:** Automation/n8n, Infrastructure & Deployment (AI_Engineer_Syllabus.pdf p.12-13)
- **Dependencies:** Projects 1 & 3 for reliable price deltas; optional connection to 4-5 for
  message personalization.
- **Success criteria:** cron-driven workflows dispatch within +/-2 min of schedule; alert
  precision >=85% (price drop threshold validation); opt-out latency <1 minute end-to-end.
- **Risks & mitigations:** notification fatigue -> user preference center with caps; n8n
  node failures -> automatic retry + dead-letter queue.
- **Launch readiness:** synthetic alerts tested in staging, Prometheus alerts on webhook
  errors, GDPR-compliant consent tracking documented.

### 7. Ethics & Production Deployment

- **Syllabus focus:** Infrastructure & Deployment, Reasoning & Ethics (AI_Engineer_Syllabus.pdf p.12-13)
- **Dependencies:** All previous projects must expose health checks and structured logging.
- **Success criteria:** SOC-style audit trail retained 90 days, privacy filters flag 100% of
  PII payloads, SLO doc approved (availability >=99.5%, response p95 <1 s for public APIs).
- **Risks & mitigations:** config drift -> IaC with policy-as-code checks; compliance gaps ->
  quarterly ethics review schedule.
- **Launch readiness:** security scan + dependency review pipeline enforced, incident
  response runbook published, data retention matrix stored in repo.

---

Refer to `CURSOR_BRAINSOTRM_1.md` and `CURSOR_BRAINSOTRM_2.md` for deep-dive specs, TDD
checklists, and per-phase execution details.
