Awesome — I’ll start generating **`BRAINSTORM_1.md`** in rich Markdown format:

- Fully structured, repo-ready (you can drop it under `/docs/roadmap/BRAINSTORM_1.md`).
- Includes:
  1. Intro (dataset + purpose)
  2. Mapping table of AI Engineer syllabus → dataset opportunities
  3. **Project #1 — Data Normalization & Pipeline**
  4. **Project #2 — Similar-Product Finder (Embedding-based)**

If it grows near 1000 lines, I’ll stop and continue in `BRAINSTORM_2.md`.
Here’s the start:

---

# 🧠 BRAINSTORM.md — AI Engineer × Grocery Optimization Roadmap (Part 1)

## 0. Overview

**Goal:** learn every major skill in the _AI Engineer Syllabus_ while building a real-world, revenue-ready grocery optimization engine that helps Israeli consumers find the cheapest basket and substitutes across chains like **Rami Levi**, **Shufersal**, **Osher Ad**, etc.

### 📊 Dataset Summary (from Kaggle)

- **Name:** Israeli Supermarkets 2024 Dataset ([source](https://www.kaggle.com/datasets/erlichsefi/israeli-supermarkets-2024/data))
- **Scope:** ≈ 200 files, 6.7 GB+, raw price/promo/store data scraped every 4 hours from all major chains.
- **Files per chain:**
  - `price_file_[chain].csv` — incremental price updates
  - `price_full_file_[chain].csv` — daily full snapshots
  - `promo_file_[chain].csv` / `promo_full_file_[chain].csv` — promotions
  - `stores_[chain].csv` — store metadata (name, address, geo)
  - `[chain].json` — scraper metadata (status, timestamps)

- **Update frequency:** Daily
- **Licensing:** MIT
- **Languages:** Hebrew & English
- **Tags:** Tabular · Text · Time Series · Hebrew

### 🧭 Why It’s Perfect for AI Engineering

It combines **structured (tabular)** + **unstructured (textual)** + **temporal (time-series)** data — perfect to learn everything from ETL to embeddings, RAG, agents, and deployment.

---

## 1. Mapping Syllabus → Dataset Opportunities

| Syllabus Topic                         | Grocery Use Case                               | Example Feature                                        |
| -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| **Python Essentials**                  | Data parsing & schema validation across chains | Normalize product feeds with tests and FastAPI ETL     |
| **ML Foundations**                     | Price trend analysis / cheapest store ranking  | Regression & classification for basket cost prediction |
| **NLP + RAG**                          | Product name matching across brands            | “Tnuva Milk 1 L 3%” ≈ “Tara Milk 3% 1 L”               |
| **Advanced LLMs / Prompt Engineering** | Conversational shopping assistant              | “Find me 5 breakfast items under 50 ₪”                 |
| **Applied LLM Engineering**            | Cart optimization via structured MCP API       | Generate optimized baskets from text                   |
| **Automation / n8n**                   | Daily price alerts + data pipeline refresh     | n8n flows for ETL + notifications                      |
| **AI Agents**                          | Multi-store optimizer agent                    | Combine price & substitute APIs → best cart            |
| **Infra & Deployment**                 | Containerized stack with monitoring            | Docker + Prometheus + Grafana                          |
| **Reasoning & Ethics**                 | Transparent cart optimization                  | Explainable AI for “why this store is cheaper”         |

---

## 2. Project #1 — 🧱 Data Normalization & Pipeline Service

### 🎓 Topics Covered

- Python Essentials (virtual envs, I/O, OOP, exceptions)
- ML Foundations (data pre-processing, validation)
- Infrastructure and Deployment (Docker, FastAPI)
- TDD / Spec-Driven Development (CI basics)

### 💡 Concrete Value

Creates a single unified **API and database** that every other component (LLM, agent, ML) can depend on.
Without this layer, nothing downstream is reliable.

### 🧩 Phases & TODOs

#### **Phase 1 — Foundation Build**

- **Spec:** Define canonical schemas for `Product`, `Store`, `PriceRecord`, `Promo`.
- **TDD setup:**

  ```bash
  pytest tests/test_schema_validation.py
  ```

- **TODOs**
  - [ ] Write dataclasses for core entities
  - [ ] Implement CSV parsers per chain
  - [ ] Add unit tests for column presence & types
  - [ ] Handle encoding (UTF-8 / Hebrew)
  - [ ] Normalize units (grams, liters)
  - [ ] Dockerfile + Poetry for reproducibility

#### **Phase 2 — Integration Layer**

- **Spec:** Expose API (`/products`, `/stores`, `/prices`) via FastAPI.
- **TODOs**
  - [ ] Write contract tests for GET/POST endpoints
  - [ ] Add pagination and filters (`?chain=rami_levy&city=tel_aviv`)
  - [ ] Integrate SQLite or Postgres
  - [ ] Implement CI job to ingest new daily dump

#### **Phase 3 — Production Deployment**

- **Spec:** Containerized ETL + API stack.
- **TODOs**
  - [ ] Add logging (JSON + Prometheus metrics)
  - [ ] Deploy via Docker Compose or Kubernetes namespace `grocery-data`
  - [ ] Add basic Grafana dashboard for ingestion stats
  - [ ] Document API with OpenAPI spec in repo

### 📦 Deliverables

- `backend/data_pipeline/` module
- CI workflow (`.github/workflows/validate_data.yml`)
- API docs at `/docs`
- Portfolio screenshot of Grafana dashboard

### 🧠 Learning Outcomes

- Build production-ready ETL with tests
- Use containerization and monitoring from day 1
- Gain foundation for all AI projects ahead

---

## 3. Project #2 — 🔍 Similar-Product Finder (Embedding-Based)

### 🎓 Topics Covered

- NLP Basics (tokenization, lemmatization)
- Word/Sentence Embeddings (SBERT / FastText / USE)
- RAG architecture (document retrieval)
- Vector databases (pgvector / FAISS)
- Prompt Engineering for validation

### 💡 Concrete Value

Allows the system to suggest cheaper alternatives across brands.
Example: “Tara חלב 3% 1 ליטר” ≈ “Tnuva Milk 3% 1 L”.
This becomes the semantic bridge between store catalogs.

### 🧩 Phases & TODOs

#### **Phase 1 — Foundation (Offline Model)**

- **Spec:** Build corpus of unique product names across chains.
- **TODOs**
  - [ ] Deduplicate products by `chain, product_name`
  - [ ] Normalize text (remove punctuation, Hebrew vowels)
  - [ ] Tokenize & lemmatize (both Hebrew and English)
  - [ ] Train/test FastText model or use SBERT multilingual
  - [ ] Evaluate cosine similarity thresholds → manual validation

#### **Phase 2 — Vector Service**

- **Spec:** Serve similarity queries via REST + vector index.
- **TODOs**
  - [ ] Setup pgvector extension (Postgres 15+)
  - [ ] Implement API `/similar?query=tnuva+milk`
  - [ ] Write unit tests for top-k retrieval
  - [ ] Cache embeddings with Redis + expiry
  - [ ] Add integration tests to check consistency with baseline

#### **Phase 3 — Evaluation + Prompt Tuning**

- **Spec:** Validate results using LLM judgment (e.g., Claude/OpenAI).
- **TODOs**
  - [ ] Create prompt template for “Are these two products equivalent?”
  - [ ] Evaluate LLM agreement vs. human labels
  - [ ] Tune embedding model or threshold until > 90% precision

### 📦 Deliverables

- `services/similarity_api/` microservice
- Jupyter notebook for embedding evaluation
- REST endpoint demo (`curl localhost:8001/similar?query=milk`)
- Portfolio visual showing clusters of similar products

### 🧠 Learning Outcomes

- Master practical NLP for product matching
- Understand embedding pipelines & vector databases
- Prepare for RAG integration and cart optimization

---

**Next Up → Part 2 (`BRAINSTORM_2.md`)**
Will cover:

3️⃣ Price Intelligence Engine
4️⃣ Smart Cart Optimizer (LLM + RAG)
5️⃣ Multi-Store Agent
6️⃣ Promo Watcher
7️⃣ Deployment & Ethics
