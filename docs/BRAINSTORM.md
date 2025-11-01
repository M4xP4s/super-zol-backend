# BRAINSTORM: AI Engineering × Israeli Grocery Data

## Problem & Personas

**Problem Statement**: Israeli households and retailers struggle to act on the fast-moving, bilingual grocery market data they already generate. We need an AI-first platform that ingests nationwide supermarket feeds, reconciles messy catalogs, and turns them into real-time savings recommendations, operational alerts, and hands-on learning artifacts for the AI engineering curriculum.

**Primary Personas**:

- **Leah Cohen – Budget-Conscious Parent**: Wants weekly insight into where to buy staples 15–25% cheaper without sifting through 40 supermarket apps. Success = automated savings tips she can trust.
- **Yossi Bar-On – Regional Operations Manager**: Needs daily competitor pricing and promotion analytics to react within hours. Success = anomaly alerts plus clear actions for branch managers.
- **AI Engineering Cohort**: Learners following the syllabus who need production-grade projects with clear entry/exit criteria. Success = demonstrable mastery across data, ML, LLM, and ops.

## Data Nature & Characteristics

### Israeli Supermarkets 2024 Dataset

**Size**: ~6.7GB, 37.9M+ rows
**Coverage**: 40+ Israeli supermarket chains
**Update Frequency**: Daily (4-hour scrape cycles)
**Languages**: Bilingual (Hebrew/English)

**Key Data Types**:

1. **Price Data**: Current prices across all chains, historical price trends
2. **Product Catalog**: 100K+ products with names, barcodes, categories
3. **Promotions**: Active deals, discounts, bundle offers
4. **Store Information**: Locations, branches, operating hours
5. **Temporal Patterns**: Seasonal variations, holiday pricing, inflation trends

**Data Leverage Opportunities**:

| Dataset Slice                      | Potential Products                                    | Key Questions                                                           |
| ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Daily price and promotion feeds    | Dynamic basket optimizer, anomaly alerts              | How quickly can we detect >4σ price moves by chain/region?              |
| Product catalog metadata           | Multilingual embeddings, taxonomy enrichment          | Can we auto-standardize names across chains with ≥0.85 similarity?      |
| Store geospatial data              | Geo-personalized recommendations, retailer dashboards | What geo granularity (city, neighborhood) is stable enough for routing? |
| Historical price archives          | Inflation trackers, household budgeting advice        | Which commodities exhibit predictable seasonal patterns?                |
| Consumer interaction logs (future) | Conversational assistant tuning, user memory          | What feedback loops keep hallucinations <5% while staying useful?       |

**Risks & Unknowns**:

| Risk                                               | Owner            | Mitigation                                                                       |
| -------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| Encoding inconsistencies break ingestion pipelines | Data Engineering | Use charset detection with fallback tests, maintain sample fixture set per chain |
| Product name drift reduces similarity precision    | ML/NLP           | Schedule weekly embedding refresh, add human-reviewed spot checks                |
| Hebrew NLP support lags behind English             | ML/NLP           | Benchmark multilingual SBERT vs AlephBERT; budget spike for custom fine-tuning   |
| Holiday volatility triggers false price alerts     | Data Science     | Layer holiday calendar features, add adaptive thresholds                         |
| Privacy expectations for receipts and budgets      | Compliance       | Apply default PII redaction, document consent flows before launch                |

## Consolidated Project Mapping

After analyzing both Claude and Cursor roadmaps, I've consolidated 17 proposed projects into **3 comprehensive projects** that cover all AI Engineering Syllabus topics while delivering maximum value:

### Project 1: Smart Grocery Intelligence Platform

**Syllabus Coverage**: Python Essentials, ML Foundations, NLP, Infrastructure  
**Value Hypothesis**: Foundation that enables 15–25% household savings through intelligent price comparison.

**North-Star Outcome**: Deliver price-comparison APIs with <200 ms latency, covering ≥95% of the daily catalog and powering downstream products without manual intervention.

**Enabler Features**:

- Multilingual product matching using SBERT embeddings with ≥0.85 cosine on validation pairs
- Automated category classification for 100K+ products with macro F1 ≥0.8
- Real-time anomaly detection surface >4σ price spikes within 30 minutes
- Time-series forecasting for price trends with MAPE <4%

**Spike Ideas & Open Questions**:

- Validate SBERT Hebrew performance vs. contextual models (goal: decide fine-tune budget)
- Sample 500 records per chain to quantify encoding variance before finalizing ETL contracts
- Prototype Polars vs. Pandas ingestion to confirm throughput target of >1M rows/min

### Project 2: Conversational Shopping Assistant

**Syllabus Coverage**: LLM Integration, RAG, AI Agents, Prompt Engineering, Multimodal AI  
**Value Hypothesis**: Natural language interface saving users ≈50 NIS/month through automated analysis.

**North-Star Outcome**: Ship a bilingual assistant that plans and optimizes a weekly basket end-to-end in <2 minutes with ≥85% user satisfaction.

**Enabler Features**:

- RAG-powered product search in Hebrew/English with hallucination rate <5%
- Multimodal receipt processing with OCR accuracy ≥95%
- Voice-driven shopping list creation with word-error-rate <10%
- Multi-store optimization agent surfacing ≥10% savings vs. baseline

**Spike Ideas & Open Questions**:

- Compare Claude vs. GPT tool-calling for Hebrew support and latency; record best-of-three transcripts
- Evaluate off-the-shelf OCR (Google Vision, AWS Textract) on receipt corpus; collect accuracy deltas
- Explore caching strategies (Redis vector cache vs. local FAISS) for sub-second retrieval

### Project 3: Automated Budget Optimizer

**Syllabus Coverage**: Automation/n8n, Infrastructure, Ethics, Model Reasoning  
**Value Hypothesis**: Production-grade system with personalized coaching improving budget adherence by ≥15%.

**North-Star Outcome**: Operate a self-healing automation layer with ≥98% workflow success and audited compliance for all user data flows.

**Enabler Features**:

- Automated workflow orchestration with n8n covering daily refresh, alerts, and reporting
- Real-time monitoring and drift detection with alert-to-acknowledge <5 minutes
- Personalized financial recommendations with explainable rationale & guardrails
- Privacy-preserving analytics with default PII scrubbing and opt-in retention

**Spike Ideas & Open Questions**:

- Stress-test n8n scaling on Kubernetes vs. managed alternative (Temporal, Dagster)
- Draft policy-as-code templates (OPA/Rego) for data access and see integration overhead
- Determine minimal viable consent UX to stay compliant without blocking onboarding

## Learning Path Alignment

### How Each Project Maps to Syllabus Topics

**Foundation Topics (Project 1)**:

- Python Essentials → ETL pipeline, data validation
- ML Foundations → Classification, regression, forecasting
- NLP → Text processing, embeddings, similarity matching
- Infrastructure → Docker, APIs, monitoring

**Advanced AI Topics (Project 2)**:

- LLM Integration → OpenAI/Claude APIs with MCP architecture
- RAG → Vector search, document retrieval, context management
- AI Agents → Multi-step reasoning, tool orchestration
- Prompt Engineering → Chain-of-thought, few-shot learning

**Production Topics (Project 3)**:

- Automation → Scheduled workflows, notifications
- Model Reasoning → Explainable AI, decision matrices
- Ethics → Bias detection, privacy compliance
- Deployment → Kubernetes, CI/CD, observability

## Value Proposition Summary

### For Consumers

- **Immediate**: 15-25% savings on grocery bills
- **Convenience**: Voice and chat interfaces in Hebrew/English
- **Intelligence**: Personalized recommendations based on preferences
- **Transparency**: Clear explanations for all recommendations

### For Retailers

- **Market Intelligence**: Real-time competitor pricing
- **Promotion Effectiveness**: ROI tracking and optimization
- **Customer Insights**: Aggregated shopping patterns
- **Operational Efficiency**: Automated reporting and alerts

### For Learning

- **Comprehensive**: 100% syllabus coverage
- **Practical**: Production-ready systems, not toys
- **Progressive**: Each project builds on previous
- **Portfolio-Ready**: 3 shippable products demonstrating full-stack AI engineering

## Implementation Philosophy

### Test-Driven Development (TDD)

Every feature starts with tests:

1. RED: Write failing test for desired behavior
2. GREEN: Implement minimal code to pass
3. REFACTOR: Improve code while maintaining tests

### Spec-Driven Development

Clear specifications before coding:

- JSON Schema for all APIs
- Zod/Pydantic for data validation
- OpenAPI documentation
- Behavioral contracts

### Production-First Mindset

- Monitoring from day one
- Security by design
- Scalability considerations
- Documentation as code

### Operating Cadence (Solo-Friendly)

- **Daily (15 min)**: Personal progress journal — capture wins, blockers, risk updates in `logs/daily.md`
- **Weekly (60 min)**: Solo demo & decision review — run key Nx tasks (`pnpm nx graph`, `pnpm nx run-many --target=test`) and record outcomes
- **Biweekly (45 min)**: Backlog refinement session — promote brainstorm spikes into actionable TODO.md items
- **Monthly (90 min)**: Deep retro tying progress to syllabus coverage, adjust roadmap, archive learnings
- **Always-On**: Keep Grafana dashboards/widgets open while working; log incidents + ADRs as they happen

## Success Metrics

### Technical Excellence

- > 90% test coverage
- <200ms API response times
- > 99.5% system availability
- <5% LLM hallucination rate

### Business Impact

- 10K+ active users within 6 months
- 15-25% average household savings
- > 85% user satisfaction rating
- Zero compliance violations

### Learning Outcomes

- Master entire AI Engineering stack
- Build production-grade systems
- Create impactful portfolio
- Ready for AI Engineering roles

## Multi-Sprint Outlook

| Sprint          | Focus                       | Entry Criteria                          | Exit Criteria                                                                                |
| --------------- | --------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Sprint 0 (Prep) | Environment & data audit    | Personas + risk table agreed            | Dockerized dev stack, Kaggle access verified, sample feeds cataloged                         |
| Sprint 1        | ETL foundation              | Prep exit + fixture set ready           | Ingestion MVP for 3 chains, validation metrics logging, `pnpm nx test data-pipeline` passing |
| Sprint 2        | Similarity & classification | Sprint 1 exit + labeled pairs backlog   | Embedding pipeline deployed, F1 ≥0.75, decision on fine-tuning budget                        |
| Sprint 3        | Price intelligence APIs     | Sprint 2 exit + forecast features ready | Basket comparison endpoints live, latency <200 ms p95, anomaly alerts tuned                  |
| Sprint 4        | Conversational MVP          | Sprint 3 exit + vector store seeded     | Assistant handles top 5 intents, hallucination <7%, OCR benchmark recorded                   |
| Sprint 5        | Automation & governance     | Sprint 4 exit + ops runbook drafted     | n8n workflows drivable, monitoring dashboards live, privacy controls validated               |

Link the sprint deliverables directly into `docs/TODO.md` and `docs/PLAN.md` to keep execution synchronized.

---

_This consolidated plan transforms Israeli grocery data into a comprehensive AI learning journey, delivering real value while mastering every aspect of modern AI engineering._
