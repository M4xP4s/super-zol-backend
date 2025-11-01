# AI Engineering + Grocery Data: Project Brainstorm

## Executive Summary

This document maps the AI Engineer Syllabus topics to practical, value-driven projects using the Israeli Supermarkets 2024 Kaggle dataset. Each project combines theoretical learning with real-world application, creating tools that provide genuine value to consumers and businesses in the grocery/retail sector.

## Dataset Overview: Israeli Supermarkets 2024

### Scale & Scope

- **Total Size**: 6.4 GB of production-scale retail data
- **Records**: 37.9+ million rows across 162 CSV files
- **Coverage**: 40+ major Israeli supermarket chains
- **Snapshot Date**: November 1, 2025 (20251101)

### Data Categories

#### 1. Price Files (`price_file_*.csv` and `price_full_file_*.csv`)

- **Content**: Complete product catalogs with pricing
- **Key Fields**: Item codes, names, descriptions, manufacturer details, prices, unit prices, quantities
- **Largest File**: `price_file_dor_alon.csv` (1.08 GB, 6.6M rows)
- **Use Cases**: Price comparison, inflation tracking, product matching

#### 2. Promotion Files (`promo_file_*.csv` and `promo_full_file_*.csv`)

- **Content**: Active promotional campaigns and discounts
- **Key Fields**: Promotion IDs, descriptions, start/end dates, discount types, minimum quantities, club restrictions
- **Largest File**: `promo_full_file_super_pharm.csv` (1.23 GB, 2M rows)
- **Use Cases**: Deal finding, promotion pattern analysis, savings optimization

#### 3. Store Files (`store_file_*.csv`)

- **Content**: Physical store locations and metadata
- **Key Fields**: Chain ID, store ID, addresses, cities, zip codes, store types
- **Use Cases**: Route planning, regional price analysis, store locators

### Major Chains Included

Shufersal, Rami Levy, Osher Ad, Dor Alon, Super Pharm, Good Pharm, Victory, Yellow, Keshet, Tiv Taam, Yohananof, Mahsani Ashuk, City Market, King Store, Carrefour, Wolt, and 25+ more.

### Why This Dataset is Perfect for AI Engineering

1. **Real-world Complexity**: Multilingual text (Hebrew/English), inconsistent formats, production-scale data
2. **Rich Features**: Temporal data, geographic distribution, categorical hierarchy
3. **Practical Relevance**: Universal use case - everyone shops for groceries
4. **Engineering Challenges**: Requires proper data pipelines, can't fit in memory, needs optimization
5. **Multi-modal Potential**: Can extend with receipt images, voice interfaces, visual dashboards

---

## Project 1: Smart Grocery Price Comparison Agent

### Syllabus Topics Covered

- **AI Agents** (agent design, tool orchestration, memory management)
- **LLM Integration** (Claude API, OpenAI API, structured outputs)
- **Prompt Engineering** (CoT, ReAct patterns, few-shot prompting)
- **NLP Fundamentals** (text preprocessing, embeddings, similarity matching)
- **Applied LLM Engineering** (tool use, retries, error handling)

### Concrete Value Proposition

**Consumer Savings**: Average household can save 15-25% on grocery bills by shopping strategically across chains
**Time Efficiency**: Reduce price research from hours to seconds
**Decision Support**: Get personalized recommendations based on location and preferences
**ROI**: Family of 4 can save ₪500-800/month (~$150-250)

### Development Phases

#### Phase 1: Foundation & Data Pipeline (Week 1-2)

**Specification-Driven Development**:

```yaml
API Specification:
  POST /api/agent/query
    Request: { query: string, location?: string, max_results?: number }
    Response: { products: Product[], savings: number, recommendations: string[] }
```

**TODOs with TDD Approach**:

- [ ] TODO: Write test suite for product name normalization
  - Test: Hebrew/English variations should match (e.g., "חלב" == "milk")
  - Test: Brand name extraction (e.g., "Tnuva 3% Milk" → brand: "Tnuva")
  - Test: Handle typos and abbreviations
- [ ] TODO: Implement data ingestion pipeline
  - Test: Verify CSV parsing handles encoding (UTF-8, Windows-1255)
  - Test: Data validation (prices > 0, valid dates)
  - Test: Performance benchmark (process 1M rows < 30 seconds)
- [ ] TODO: Design and test agent tool interfaces
  ```python
  def test_price_lookup_tool():
      tool = PriceLookupTool()
      result = tool.execute("milk", location="Tel Aviv")
      assert len(result.products) > 0
      assert all(p.price > 0 for p in result.products)
  ```
- [ ] TODO: Create vector embeddings for product matching
  - Test: Similar products have cosine similarity > 0.8
  - Test: Different categories have similarity < 0.3
- [ ] TODO: Set up PostgreSQL database with indexes
  - Test: Query performance < 100ms for common lookups
  - Test: Full-text search on Hebrew text works correctly

#### Phase 2: Core Agent Implementation (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Implement LangChain agent with tools
  ```python
  def test_agent_multi_step_reasoning():
      agent = GroceryAgent()
      response = agent.query("Find cheapest milk and bread near me")
      assert "milk" in response.lower()
      assert "bread" in response.lower()
      assert response.includes_prices()
  ```
- [ ] TODO: Create prompt templates with CoT reasoning
  - Test: Agent explains reasoning steps
  - Test: Handles ambiguous queries ("cheap groceries")
  - Test: Provides alternatives when product not found
- [ ] TODO: Implement conversation memory
  - Test: Remembers user location across queries
  - Test: Recalls previous product searches
  - Test: Memory persists across sessions
- [ ] TODO: Add promotion awareness
  - Test: Agent considers active promotions in recommendations
  - Test: Calculates correct discount amounts
  - Test: Handles "buy 2 get 1" scenarios correctly
- [ ] TODO: Create substitution recommender
  - Test: Suggests cheaper alternatives in same category
  - Test: Respects dietary restrictions (kosher, vegan)
  - Test: Handles brand preferences

#### Phase 3: Production Deployment (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Dockerize application
  - Test: Container starts in < 5 seconds
  - Test: Health check endpoint responds
  - Test: Graceful shutdown on SIGTERM
- [ ] TODO: Implement caching layer (Redis)
  - Test: Cache hit rate > 70% for common queries
  - Test: Cache invalidation on price updates
  - Test: TTL expiration works correctly
- [ ] TODO: Add monitoring and observability
  ```python
  def test_metrics_collection():
      metrics = get_prometheus_metrics()
      assert "agent_query_latency" in metrics
      assert "llm_token_usage" in metrics
      assert "cache_hit_rate" in metrics
  ```
- [ ] TODO: Create CI/CD pipeline
  - Test: All unit tests pass in CI
  - Test: Integration tests with test database
  - Test: Automated deployment to staging
- [ ] TODO: Implement rate limiting and error handling
  - Test: Graceful degradation when LLM unavailable
  - Test: Retry logic with exponential backoff
  - Test: User-friendly error messages
- [ ] TODO: Create API documentation and examples
  - Test: OpenAPI spec validates correctly
  - Test: Example code runs without modification
  - Test: Documentation covers all endpoints

---

## Project 2: Promotional Campaign Analyzer with RAG

### Syllabus Topics Covered

- **RAG Architecture** (retrieval, augmentation, generation)
- **Vector Databases** (FAISS, embeddings, similarity search)
- **Advanced NLP** (Sentence-BERT, text classification, NER)
- **Machine Learning** (XGBoost, LightGBM, feature engineering)
- **FastAPI** (async programming, dependency injection, middleware)
- **Model Evaluation** (cross-validation, metrics, A/B testing)

### Concrete Value Proposition

**Business Intelligence**: Retailers understand competitor strategies and optimize promotions
**Consumer Insights**: Predict upcoming deals with 75%+ accuracy
**Market Analysis**: Track promotional trends across categories and seasons
**Revenue Impact**: 10-15% increase in promotional effectiveness

### Development Phases

#### Phase 1: Data Pipeline & Analysis (Week 1-2)

**Specification-Driven Development**:

```yaml
Data Schema:
  Promotion:
    id: string
    chain: string
    products: ProductList
    discount_type: enum[percentage, fixed, bundle]
    start_date: datetime
    end_date: datetime
    conditions: ConditionList
```

**TODOs with TDD Approach**:

- [ ] TODO: Parse and normalize promotion data
  ```python
  def test_promotion_parser():
      promo = parse_promotion("Buy 2 Get 1 Free")
      assert promo.discount_type == "bundle"
      assert promo.buy_quantity == 2
      assert promo.get_quantity == 1
  ```
- [ ] TODO: Extract promotion patterns
  - Test: Identify seasonal patterns (holidays, summer)
  - Test: Detect category-specific promotions
  - Test: Calculate actual discount percentages
- [ ] TODO: Build promotion taxonomy
  - Test: Classify discount types correctly
  - Test: Handle Hebrew and English descriptions
  - Test: Map products to categories
- [ ] TODO: Create time-series features
  ```python
  def test_seasonal_features():
      features = extract_features(date="2024-12-15")
      assert features["is_holiday_season"] == True
      assert features["days_to_weekend"] <= 7
  ```
- [ ] TODO: Design database schema for promotions
  - Test: Efficient queries by date range
  - Test: Full-text search on descriptions
  - Test: Join performance with products table

#### Phase 2: RAG System & ML Models (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Generate embeddings for promotions
  ```python
  def test_embedding_similarity():
      emb1 = embed("50% off all dairy")
      emb2 = embed("Half price milk products")
      similarity = cosine_similarity(emb1, emb2)
      assert similarity > 0.7
  ```
- [ ] TODO: Set up FAISS vector database
  - Test: Index 1M promotions in < 60 seconds
  - Test: Query latency < 50ms
  - Test: Retrieval precision > 0.8
- [ ] TODO: Train promotion prediction model
  ```python
  def test_promotion_predictor():
      model = PromotionPredictor()
      pred = model.predict(
          product="milk",
          chain="shufersal",
          date="2024-11-15"
      )
      assert 0 <= pred.probability <= 1
      assert pred.confidence_interval is not None
  ```
- [ ] TODO: Implement RAG pipeline
  - Test: Retrieves relevant historical promotions
  - Test: Generates coherent summaries
  - Test: Handles multi-chain queries
- [ ] TODO: Create feature importance analysis
  - Test: SHAP values explain predictions
  - Test: Feature importance rankings consistent
  - Test: Handles missing features gracefully

#### Phase 3: API & Production (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Build FastAPI endpoints
  ```python
  def test_api_endpoints():
      response = client.post("/analyze", json={
          "chain": "rami_levy",
          "category": "dairy"
      })
      assert response.status_code == 200
      assert "insights" in response.json()
  ```
- [ ] TODO: Implement async request handling
  - Test: Handle 100 concurrent requests
  - Test: Request timeout after 30 seconds
  - Test: Graceful error handling
- [ ] TODO: Add response caching
  - Test: Cache headers set correctly
  - Test: ETags for conditional requests
  - Test: Cache invalidation on updates
- [ ] TODO: Create batch processing jobs
  - Test: Daily promotion import runs successfully
  - Test: Handles partial failures
  - Test: Sends completion notifications
- [ ] TODO: Deploy with auto-scaling
  - Test: Scales up under load
  - Test: Scales down during quiet periods
  - Test: Zero-downtime deployments
- [ ] TODO: Create dashboard with insights
  - Test: Real-time data updates
  - Test: Export functionality works
  - Test: Mobile responsive design

---

## Project 3: Multimodal Grocery Receipt Assistant

### Syllabus Topics Covered

- **Multimodal AI** (vision models, OCR, image processing)
- **LLM Integration** (GPT-4 Vision, Claude Vision)
- **n8n Automation** (workflows, webhooks, integrations)
- **AI Agents** (tool use, multi-step reasoning)
- **Applied Engineering** (error handling, retries, validation)

### Concrete Value Proposition

**Expense Tracking**: Automated receipt processing saves 30 min/week
**Price Verification**: Catch overcharges and pricing errors (avg ₪50/month saved)
**Budget Management**: Real-time spending insights and alerts
**Tax Preparation**: Organized expense reports for businesses

### Development Phases

#### Phase 1: Receipt Processing Pipeline (Week 1-2)

**Specification-Driven Development**:

```yaml
Receipt Processing Flow: 1. Image Upload → Validation
  2. OCR/Vision API → Text Extraction
  3. Item Matching → Database Lookup
  4. Price Verification → Discrepancy Detection
  5. Report Generation → User Notification
```

**TODOs with TDD Approach**:

- [ ] TODO: Implement image validation
  ```python
  def test_image_validator():
      validator = ReceiptValidator()
      assert validator.is_valid("receipt.jpg") == True
      assert validator.is_valid("random.txt") == False
      assert validator.check_quality(blurry_image) == False
  ```
- [ ] TODO: Integrate vision API for OCR
  - Test: Extract items with 95%+ accuracy
  - Test: Handle Hebrew and English text
  - Test: Parse prices and quantities correctly
- [ ] TODO: Create item matching algorithm
  ```python
  def test_fuzzy_matching():
      matcher = ItemMatcher(database)
      result = matcher.match("Tnuva Mlk 3%")
      assert result.product_id == "tnuva_milk_3_percent"
      assert result.confidence > 0.8
  ```
- [ ] TODO: Build price verification logic
  - Test: Detect overcharges > ₪0.50
  - Test: Validate promotion applications
  - Test: Check quantity calculations
- [ ] TODO: Design receipt data model
  - Test: Store complete receipt metadata
  - Test: Link items to products table
  - Test: Track price history

#### Phase 2: Intelligence Layer (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Create savings analyzer
  ```python
  def test_savings_calculator():
      analyzer = SavingsAnalyzer()
      savings = analyzer.calculate(receipt, alternatives)
      assert savings.total_possible > 0
      assert len(savings.recommendations) > 0
  ```
- [ ] TODO: Implement budget tracking
  - Test: Categorize expenses correctly
  - Test: Track spending against limits
  - Test: Generate weekly/monthly summaries
- [ ] TODO: Build loyalty program optimizer
  - Test: Identify applicable discounts
  - Test: Calculate points/rewards
  - Test: Suggest optimal payment methods
- [ ] TODO: Create shopping insights generator
  ```python
  def test_insights_generation():
      insights = generate_insights(receipts_30_days)
      assert "top_categories" in insights
      assert "spending_trend" in insights
      assert insights.savings_opportunities > 0
  ```
- [ ] TODO: Add anomaly detection
  - Test: Flag unusual price increases
  - Test: Detect duplicate charges
  - Test: Identify missing discounts

#### Phase 3: Automation & Deployment (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Set up n8n workflow
  ```yaml
  Workflow Test:
    - Webhook receives image
    - Trigger vision processing
    - Store results in database
    - Send notification
    - Verify each step completes < 10 seconds
  ```
- [ ] TODO: Implement webhook endpoint
  - Test: Handle multipart file uploads
  - Test: Validate request signatures
  - Test: Queue processing for large files
- [ ] TODO: Create notification system
  - Test: Email notifications sent correctly
  - Test: SMS integration works
  - Test: Push notifications to mobile app
- [ ] TODO: Build user dashboard
  ```python
  def test_dashboard_api():
      response = client.get("/dashboard/user123")
      assert response.status_code == 200
      data = response.json()
      assert "total_spent" in data
      assert "receipts" in data
  ```
- [ ] TODO: Add export functionality
  - Test: Generate PDF reports
  - Test: Export to CSV/Excel
  - Test: Create tax-ready summaries
- [ ] TODO: Deploy with monitoring
  - Test: Track processing success rate
  - Test: Monitor API latencies
  - Test: Alert on failures > 5%

---

## Project 4: Real-Time Price Monitoring Dashboard

### Syllabus Topics Covered

- **Infrastructure & Deployment** (Docker, Kubernetes, CI/CD)
- **Monitoring** (Prometheus, Grafana, OpenTelemetry)
- **n8n Automation** (scheduled jobs, error handling)
- **Database Design** (time-series data, indexing, partitioning)
- **Production Engineering** (scaling, caching, load balancing)

### Concrete Value Proposition

**Price Transparency**: Real-time visibility into market pricing
**Competitive Intelligence**: Businesses track competitor pricing strategies
**Consumer Alerts**: Instant notifications for price drops on watched items
**Market Research**: Historical data for trend analysis and forecasting

### Development Phases

#### Phase 1: Data Ingestion Infrastructure (Week 1-2)

**Specification-Driven Development**:

```yaml
System Architecture:
  Components:
    - Data Collector (Python service)
    - Message Queue (RabbitMQ/Kafka)
    - Database (TimescaleDB)
    - Cache Layer (Redis)
    - API Gateway (FastAPI)
    - Frontend (React Dashboard)
```

**TODOs with TDD Approach**:

- [ ] TODO: Create data collection service
  ```python
  def test_data_collector():
      collector = DataCollector()
      result = collector.fetch_prices("shufersal")
      assert result.record_count > 1000
      assert result.errors == []
      assert result.duration < 30  # seconds
  ```
- [ ] TODO: Implement change detection
  - Test: Identify price changes > 1%
  - Test: Track new/discontinued products
  - Test: Handle missing data gracefully
- [ ] TODO: Design time-series schema
  ```sql
  -- Test: Query performance for 30-day window
  CREATE TABLE price_history (
      time TIMESTAMPTZ,
      product_id TEXT,
      chain_id TEXT,
      price DECIMAL,
      PRIMARY KEY (product_id, chain_id, time)
  );
  -- Test: < 100ms query time for common queries
  ```
- [ ] TODO: Set up message queue
  - Test: Handle 10K messages/second
  - Test: Guarantee delivery (at-least-once)
  - Test: Dead letter queue for failures
- [ ] TODO: Build data validation pipeline
  ```python
  def test_validation_rules():
      validator = PriceValidator()
      assert validator.check(price=-10) == False
      assert validator.check(price=99999) == False
      assert validator.check_change(1000, 10) == False  # 100x change
  ```

#### Phase 2: Processing & Analytics (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Create aggregation jobs
  ```python
  def test_hourly_aggregation():
      aggregator = PriceAggregator()
      result = aggregator.hourly_stats("2024-11-01")
      assert result.avg_price > 0
      assert result.total_products > 0
      assert result.chains_updated > 0
  ```
- [ ] TODO: Implement alerting logic
  - Test: Trigger on 10% price drop
  - Test: Batch alerts (max 1 per hour)
  - Test: User preference filtering
- [ ] TODO: Build trend analysis
  ```python
  def test_trend_detection():
      analyzer = TrendAnalyzer()
      trend = analyzer.detect(product_id="milk_tnuva")
      assert trend.direction in ["up", "down", "stable"]
      assert trend.confidence > 0.7
  ```
- [ ] TODO: Create comparison engine
  - Test: Compare prices across chains
  - Test: Calculate savings potential
  - Test: Generate shopping recommendations
- [ ] TODO: Add statistical analysis
  - Test: Calculate price volatility
  - Test: Identify seasonal patterns
  - Test: Detect price anomalies

#### Phase 3: Dashboard & Production (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Build React dashboard
  ```javascript
  test('Dashboard loads price data', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Current Prices/)).toBeInTheDocument();
      expect(screen.getByTestId('price-chart')).toBeVisible();
    });
  });
  ```
- [ ] TODO: Create WebSocket updates
  - Test: Real-time price updates < 1 second latency
  - Test: Reconnection on disconnect
  - Test: Handle 1000 concurrent connections
- [ ] TODO: Implement API rate limiting
  ```python
  def test_rate_limiting():
      for i in range(101):
          response = client.get("/api/prices")
      assert response.status_code == 429  # Too Many Requests
      assert "Retry-After" in response.headers
  ```
- [ ] TODO: Deploy with Docker Compose
  - Test: All services start correctly
  - Test: Inter-service communication works
  - Test: Persistent volumes mount properly
- [ ] TODO: Set up monitoring stack
  ```yaml
  Monitoring Tests:
    - Prometheus scrapes metrics
    - Grafana dashboards load
    - Alerts fire on test conditions
    - Logs aggregate in Loki
  ```
- [ ] TODO: Create CI/CD pipeline
  - Test: Build completes in < 5 minutes
  - Test: Tests run in parallel
  - Test: Deployment to staging automatic
  - Test: Rollback capability works

---

## Project 5: Grocery Chatbot with Shopping Optimizer

### Syllabus Topics Covered

- **Chatbot Development** (conversation design, context management)
- **MCP Architecture** (client/server model, protocol design)
- **Prompt Engineering** (role prompting, structured outputs)
- **LLM Integration** (Claude API, response streaming)
- **Route Optimization** (graph algorithms, traveling salesman)

### Concrete Value Proposition

**Time Savings**: Reduce shopping planning from 45 min to 5 min
**Cost Optimization**: Find cheapest shopping route (save 20-30%)
**Convenience**: Natural language interface for all demographics
**Accessibility**: Voice support for elderly/disabled users

### Development Phases

#### Phase 1: MCP Architecture Setup (Week 1-2)

**Specification-Driven Development**:

```yaml
MCP Protocol:
  Server Methods:
    - searchProducts(query, filters)
    - comparePreces(products, location)
    - findPromotions(products)
    - optimizeRoute(stores, items)

  Client Capabilities:
    - Natural language processing
    - Context management
    - Error recovery
```

**TODOs with TDD Approach**:

- [ ] TODO: Implement MCP server
  ```python
  def test_mcp_server():
      server = MCPServer()
      response = server.handle_request({
          "method": "searchProducts",
          "params": {"query": "milk"}
      })
      assert response["status"] == "success"
      assert len(response["data"]) > 0
  ```
- [ ] TODO: Create MCP client
  - Test: Connect to server successfully
  - Test: Handle connection drops
  - Test: Retry with backoff
- [ ] TODO: Design conversation state manager
  ```python
  def test_conversation_state():
      manager = ConversationManager()
      manager.add_message("user", "I need milk")
      manager.add_message("assistant", "Found 5 options")
      assert manager.get_context()["products"] == ["milk"]
  ```
- [ ] TODO: Build request router
  - Test: Route to correct handler
  - Test: Validate request format
  - Test: Handle unknown methods
- [ ] TODO: Implement structured outputs
  ```python
  def test_structured_response():
      output = format_response(products)
      assert json.loads(output)  # Valid JSON
      assert "products" in output
      assert all("price" in p for p in output["products"])
  ```

#### Phase 2: Chatbot Intelligence (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Create intent recognition
  ```python
  def test_intent_classifier():
      classifier = IntentClassifier()
      intent = classifier.classify("Where can I buy milk?")
      assert intent.type == "product_search"
      assert intent.confidence > 0.8
  ```
- [ ] TODO: Build shopping list parser
  - Test: Extract items from natural text
  - Test: Handle quantities and units
  - Test: Disambiguate similar items
- [ ] TODO: Implement route optimizer
  ```python
  def test_route_optimization():
      optimizer = RouteOptimizer()
      route = optimizer.plan(
          items=["milk", "bread"],
          location="Tel Aviv"
      )
      assert route.total_cost < individual_costs
      assert route.distance < 10  # km
  ```
- [ ] TODO: Create price comparison logic
  - Test: Find best prices per item
  - Test: Consider bulk discounts
  - Test: Factor in transportation cost
- [ ] TODO: Add personalization
  ```python
  def test_user_preferences():
      bot = GroceryBot(user_id="123")
      response = bot.respond("I need groceries")
      assert "kosher" in response  # User preference
      assert "Rami Levy" not in response  # Blocked chain
  ```

#### Phase 3: Production & Enhancement (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Create web interface
  ```javascript
  test('Chat interface works', () => {
    const { getByRole } = render(<ChatInterface />);
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Find milk' } });
    fireEvent.submit(input);
    expect(screen.getByText(/Searching/)).toBeVisible();
  });
  ```
- [ ] TODO: Add voice capabilities
  - Test: Speech-to-text accuracy > 90%
  - Test: Support Hebrew and English
  - Test: Text-to-speech clarity
- [ ] TODO: Implement authentication
  ```python
  def test_user_auth():
      response = client.post("/chat",
          json={"message": "Hello"},
          headers={"Authorization": "Bearer invalid"}
      )
      assert response.status_code == 401
  ```
- [ ] TODO: Create analytics dashboard
  - Test: Track conversation metrics
  - Test: Measure user satisfaction
  - Test: Identify failure patterns
- [ ] TODO: Deploy with load balancing
  - Test: Handle 500 concurrent users
  - Test: Response time < 2 seconds
  - Test: Failover to backup server
- [ ] TODO: Add A/B testing
  ```python
  def test_ab_testing():
      variant = get_experiment_variant("prompt_style", user_id)
      assert variant in ["control", "treatment"]
      assert consistent_assignment(user_id)  # Same user, same variant
  ```

---

## Next Steps

This document provides the first 5 comprehensive projects. Each project:

- Maps directly to AI Engineer Syllabus topics
- Provides concrete business/consumer value
- Follows TDD and spec-driven development
- Includes realistic timelines (6 weeks per project)
- Can be developed independently or in sequence

See `BRAINSTORM-PROJECTS-6-10.md` for the remaining 5 projects covering:

- Project 6: Product Category Classifier & Recommendation Engine
- Project 7: Smart Shopping List with Voice Interface
- Project 8: Inflation Tracker & Trend Analyzer
- Project 9: Automated Report Generator for Grocery Trends
- Project 10: Personalized Budget Assistant with Memory

## Recommended Learning Path

1. **Beginners**: Start with Project 1 or 6 (foundational ML/NLP skills)
2. **Intermediate**: Projects 2, 3, or 5 (RAG, multimodal, chatbots)
3. **Advanced**: Projects 4 or 9 (production infrastructure, monitoring)
4. **Capstone**: Project 10 (combines all concepts)

Each project builds upon previous knowledge while introducing new concepts, ensuring progressive skill development aligned with the AI Engineer Syllabus.
