# AI Engineering + Grocery Data: Projects 6-10 (Claude Track)

Continuation of the Claude roadmap, focusing on advanced ML services, automation, and
personalized finance tools that build on Projects 1-5.

## Summary Table

| Project | Theme                            | Primary Outcome                                       |
| ------- | -------------------------------- | ----------------------------------------------------- |
| 6       | Classification + recommendations | Auto-categorised catalog with price-aware suggestions |
| 7       | Voice-enabled shopping           | Speech-to-cart assistant with household memory        |
| 8       | Inflation intelligence           | Time-series insights for policy makers & retailers    |
| 9       | Automated reporting              | n8n-driven weekly/monthly trend digests               |
| 10      | Budget copilot                   | Agent with compliance guardrails + financial memory   |

> Baseline validation suite from Part 1 remains in force (ingestion, API, security,
> observability, CI/CD). Each project below lists only incremental requirements.

---

## Project 6 -- Product Category Classifier & Recommendation Engine

### Syllabus Alignment

- Machine Learning Foundations, Gradient Boosting, NLP (AI_Engineer_Syllabus.pdf p.10-11).

### Value Proposition

- Auto-classify 100 K+ products; reduce manual tagging costs by NIS200 K/year.
- Improve cross-sell conversion by >25% via price-aware substitutes.

### Risks & Assumptions

- Label noise mitigated through rule-based seeding + human spot checks.
- Class imbalance may skew metrics; weighted loss functions required.
- Recommendation ethics reviewed (no promoting unhealthy swaps where restricted).

### Milestones

- **Phase 1 -- Data Prep (Week 1-2):** generate training labels (rules + LLM-assisted),
  build multilingual preprocessing, split stratified train/val/test sets.
- **Phase 2 -- Modeling (Week 3-4):** benchmark RF -> XGBoost -> LightGBM, distill LLM
  outputs into fast students, assemble ensemble with calibration.
- **Phase 3 -- Serving (Week 5-6):** expose `/classify` & `/recommend` APIs, add model
  registry + versioning, integrate A/B testing hooks.

### Success Metrics

- Top-level accuracy >=85%, macro F1 >=0.8 across departments, recommendation click-through
  uplift >=20% in pilot.

### Additional Validation

- Fairness audit ensuring equal performance across major chains.
- Drift detection job monitoring input distribution shifts.

---

## Project 7 -- Voice-Driven Smart Shopping List

### Syllabus Alignment

- Speech Processing, NLP, n8n Automation, Applied LLM Engineering
  (_AI_Engineer_Syllabus.pdf p.11-12_).

### Value Proposition

- Hands-free list creation; supports Hebrew + English families.
- Remembers dietary preferences, integrates with cart optimizer (Project 1 & 5).

### Risks & Assumptions

- Background noise and dialect variance handled via adaptive ASR models.
- Privacy controls: opt-in for retaining voice snippets; default is transcript-only.
- Dependence on upstream agent/cart services; degraded mode documented.

### Milestones

- **Phase 1 -- ASR & Intent (Week 1-2):** integrate Whisper/Deepgram, train intent
  classifier, build entity extraction for quantities + brands.
- **Phase 2 -- Workflow (Week 3-4):** store shopping list state, sync with price agent to
  suggest cheaper alternatives, schedule reminders via n8n.
- **Phase 3 -- UX & Compliance (Week 5-6):** deliver mobile/web UI, add voice biometrics
  safeguards, document parental controls.

### Success Metrics

- Word error rate <10% on noisy samples, intent recall >=92%, user task completion <30 s.

### Additional Validation

- Stress tests for multi-speaker conversations.
- Accessibility review covering voice + text fallback.

---

## Project 8 -- Inflation Tracker & Trend Analyzer

### Syllabus Alignment

- Time-Series Modeling, ML Foundations, Infrastructure & Deployment
  (_AI_Engineer_Syllabus.pdf p.10-12_).

### Value Proposition

- Weekly inflation dashboards for public + private stakeholders.
- Scenario forecasting (e.g., VAT change) for policymakers.

### Risks & Assumptions

- Macro-economic indicators sourced externally; ETL reliability tracked.
- Seasonality adjustments validated against official CPI releases.
- Communicates uncertainty transparently to avoid overconfidence.

### Milestones

- **Phase 1 -- Feature Store (Week 1-2):** aggregate prices by chain/category/region,
  engineer holiday & macro features, persist in analytical warehouse.
- **Phase 2 -- Modeling (Week 3-4):** evaluate Prophet, SARIMAX, Temporal Fusion
  Transformers, calibrate uncertainty intervals.
- **Phase 3 -- Delivery (Week 5-6):** build interactive dashboard, export CSV/API feeds,
  schedule policy briefs through n8n.

### Success Metrics

- Forecast MAPE <4% for 4-week horizon, insight generation latency <30 min, subscriber
  retention >=90%.

### Additional Validation

- Backtesting harness covering last 24 months.
- Ethical review ensuring data use aligns with consumer privacy.

---

## Project 9 -- Automated Grocery Trend Reporter

### Syllabus Alignment

- Prompt Engineering, Automation / n8n, Applied LLM Engineering
  (_AI_Engineer_Syllabus.pdf p.11-12_).

### Value Proposition

- Generates ready-to-send weekly/monthly intelligence briefings; frees analysts' time.
- Customizable segments (chain, region, category) for stakeholders.

### Risks & Assumptions

- LLM summaries must cite data sources; hallucination guardrails enforced.
- Stakeholder access lists maintained to prevent leak of sensitive insights.
- Scheduling conflicts handled via retry/backoff logic.

### Milestones

- **Phase 1 -- Template System (Week 1-2):** define prompt templates, figure library,
  translation toggles (Hebrew/English).
- **Phase 2 -- Workflow Automation (Week 3-4):** implement n8n pipeline that compiles
  metrics, runs LLM summariser, routes approvals.
- **Phase 3 -- Distribution (Week 5-6):** deliver email/Slack/Teams output, archive PDFs,
  integrate feedback loop for continuous quality improvement.

### Success Metrics

- Report generation <10 minutes, factual accuracy >=95%, stakeholder CSAT >=4.5/5.

### Additional Validation

- Human-in-the-loop checklist for critical reports.
- Automated diff highlighting between consecutive reports to flag anomalies.

---

## Project 10 -- Personalized Budget Assistant with Memory

### Syllabus Alignment

- AI Agents, Ethics & Compliance, Applied LLM Engineering
  (_AI_Engineer_Syllabus.pdf p.11-13_).

### Value Proposition

- Guides households toward budget goals, tracks spending, suggests savings actions.
- Acts as capstone integrating every upstream service (prices, promotions, agents,
  automation, dashboards).

### Risks & Assumptions

- Financial advice guardrails: disclaimers, compliance review, escalation path to human
  advisors.
- Memory storage encrypted, with user-controlled retention + deletion.
- Bias/fairness monitored to avoid disadvantaging demographic groups.

### Milestones

- **Phase 1 -- Financial Data Spine (Week 1-2):** connect banking/receipt data sources,
  normalize transactions, tag categories via Project 6 classifier.
- **Phase 2 -- Agent & Policy Layer (Week 3-5):** build goal planner, integrate decision
  matrices (savings vs. nutrition), enforce ethical constraints, implement consent flows.
- **Phase 3 -- Deployment & Oversight (Week 6-8):** ship multi-channel assistant, embed
  audit logging, run tabletop compliance drills.

### Success Metrics

- Budget adherence +15% versus baseline, response latency <3 s, compliance incidents = 0.

### Additional Validation

- Differential privacy or aggregation for analytics dashboards.
- Regular bias tests on recommendations grouped by demographics.

---

## Project Comparison Matrix

| Project | Difficulty | Time to MVP | Business Value                  | Learning Priority  |
| ------- | ---------- | ----------- | ------------------------------- | ------------------ |
| 6       | Medium     | 2-3 weeks   | Medium (operational efficiency) | High (ML baseline) |
| 7       | Medium     | 3 weeks     | High (accessibility)            | Medium             |
| 8       | Hard       | 4 weeks     | High (economic intelligence)    | High               |
| 9       | Medium     | 2 weeks     | Medium (automation)             | High               |
| 10      | Hard       | 4+ weeks    | Very High (capstone)            | High               |

## Recommended Learning Paths

1. **ML Foundations -> Agentic Systems:** 6 -> 1 -> 2 -> 5 -> 10.
2. **Production Engineering:** 4 -> 8 -> 9 -> 6 -> 10.
3. **Voice & Multimodal UX:** 3 -> 7 -> 5 -> 9 -> 10.

## Success Metrics & Governance

- Maintain >=80% automated test coverage across services.
- Track drift metrics monthly; trigger retraining when KPIs drop >5 pp.
- Conduct quarterly ethics + compliance review covering Projects 5 & 10.
