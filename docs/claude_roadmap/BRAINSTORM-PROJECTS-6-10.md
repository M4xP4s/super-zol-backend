# AI Engineering + Grocery Data: Projects 6-10

This document continues from `BRAINSTORM.md` with the remaining 5 comprehensive projects that map AI Engineering syllabus topics to practical grocery/retail applications.

---

## Project 6: Product Category Classifier & Recommendation Engine

### Syllabus Topics Covered

- **Machine Learning Foundations** (classification, feature engineering)
- **Gradient Boosting** (XGBoost, LightGBM, CatBoost)
- **NLP Fundamentals** (Word2Vec, GloVe, text preprocessing)
- **Model Distillation** (teacher-student models, knowledge transfer)
- **Model Evaluation** (precision/recall, confusion matrices, cross-validation)
- **FastAPI** (REST APIs, request/response models)

### Concrete Value Proposition

**Inventory Management**: Auto-categorize 100K+ products in seconds
**Recommendation Quality**: Increase cross-sell conversion by 25-35%
**Cost Reduction**: Replace manual categorization (save ₪200K/year for large chain)
**User Experience**: Find alternatives instantly when products out of stock

### Development Phases

#### Phase 1: Data Preparation & Feature Engineering (Week 1-2)

**Specification-Driven Development**:

```yaml
Category Taxonomy:
  Level 1: Department (Dairy, Meat, Produce, Beverages)
  Level 2: Category (Milk Products, Soft Drinks, Juices)
  Level 3: Subcategory (Whole Milk, Diet Soda, Orange Juice)

API Specification:
  POST /classify
    Request: { product_name: string, description?: string }
    Response: { categories: Category[], confidence: float }
```

**TODOs with TDD Approach**:

- [ ] TODO: Create training dataset with labels
  ```python
  def test_label_generation():
      labeler = LabelGenerator()
      labels = labeler.generate_from_rules(products)
      assert len(labels) > 10000
      assert all(l.category in VALID_CATEGORIES for l in labels)
      # Test rule-based labeling accuracy
      assert labeler.accuracy(manual_labels) > 0.85
  ```
- [ ] TODO: Implement text preprocessing pipeline
  - Test: Remove Hebrew vowels (nikud) correctly
  - Test: Handle mixed Hebrew/English text
  - Test: Normalize units (kg, g, mg → grams)
  - Test: Extract numeric features (volume, weight)
- [ ] TODO: Extract product features
  ```python
  def test_feature_extraction():
      extractor = FeatureExtractor()
      features = extractor.extract("Tnuva Milk 3% 1L")
      assert features["has_brand"] == True
      assert features["fat_percentage"] == 3.0
      assert features["volume_ml"] == 1000
      assert features["word_count"] == 4
  ```
- [ ] TODO: Build Hebrew word embeddings
  - Test: Train Word2Vec on product descriptions
  - Test: Similar products have high cosine similarity
  - Test: Brand names cluster together
- [ ] TODO: Create train/test splits
  ```python
  def test_data_splitting():
      X_train, X_test, y_train, y_test = split_data(products)
      # Stratified split maintains category distribution
      train_dist = y_train.value_counts(normalize=True)
      test_dist = y_test.value_counts(normalize=True)
      assert np.allclose(train_dist, test_dist, rtol=0.1)
  ```

#### Phase 2: Model Training & Optimization (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Train baseline Random Forest model
  ```python
  def test_baseline_model():
      model = RandomForestClassifier()
      model.fit(X_train, y_train)
      accuracy = model.score(X_test, y_test)
      assert accuracy > 0.70  # Baseline threshold
      # Check no data leakage
      assert model.score(X_train, y_train) < 0.99
  ```
- [ ] TODO: Implement XGBoost classifier
  - Test: Performance > baseline by 5%
  - Test: Training time < 60 seconds
  - Test: Handle imbalanced classes
- [ ] TODO: Optimize with LightGBM
  ```python
  def test_lightgbm_optimization():
      model = LightGBMClassifier()
      # Hyperparameter tuning
      best_params = optimize_hyperparams(model, X_train, y_train)
      model_tuned = LightGBMClassifier(**best_params)
      assert model_tuned.score(X_test, y_test) > 0.85
  ```
- [ ] TODO: Implement ensemble voting
  - Test: Combine RF, XGBoost, LightGBM
  - Test: Ensemble beats individual models
  - Test: Weighted voting based on confidence
- [ ] TODO: Use LLM for distillation
  ```python
  def test_llm_distillation():
      # Use GPT-4 as teacher
      teacher_labels = get_llm_labels(unlabeled_products)
      # Train student model on teacher's outputs
      student = train_on_soft_labels(teacher_labels)
      assert student.accuracy > 0.80
      # Student should be 100x faster than teacher
      assert student.inference_time < teacher.inference_time / 100
  ```

#### Phase 3: Recommendation System & Deployment (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Build similarity-based recommender
  ```python
  def test_product_recommendations():
      recommender = ProductRecommender()
      recs = recommender.find_similar("Tnuva Milk 3%", n=5)
      assert len(recs) == 5
      assert all("milk" in r.lower() for r in recs[:3])
      # Should recommend different brands
      brands = [extract_brand(r) for r in recs]
      assert len(set(brands)) > 2
  ```
- [ ] TODO: Add price-aware recommendations
  - Test: Cheaper alternatives ranked higher
  - Test: Consider price-quality trade-off
  - Test: Respect budget constraints
- [ ] TODO: Create FastAPI endpoints
  ```python
  def test_api_classification():
      response = client.post("/classify", json={
          "product_name": "חלב טרי 3%"
      })
      assert response.status_code == 200
      data = response.json()
      assert data["categories"][0]["name"] == "Dairy"
      assert data["confidence"] > 0.7
  ```
- [ ] TODO: Implement model versioning
  - Test: A/B test new models
  - Test: Rollback capability
  - Test: Track model performance over time
- [ ] TODO: Add caching and optimization
  ```python
  def test_inference_performance():
      # Batch prediction
      products = ["milk", "bread", "eggs"] * 100
      start = time.time()
      predictions = model.predict_batch(products)
      duration = time.time() - start
      assert duration < 1.0  # 300 predictions in < 1 second
      # Test cache hit
      cached_pred = model.predict("milk")
      assert cached_pred.from_cache == True
  ```
- [ ] TODO: Deploy with monitoring
  - Test: Track prediction latency
  - Test: Monitor category distribution drift
  - Test: Alert on accuracy degradation

---

## Project 7: Smart Shopping List with Voice Interface

### Syllabus Topics Covered

- **Speech Processing** (Whisper API, speech-to-text, text-to-speech)
- **Advanced NLP** (entity extraction, quantity parsing, intent recognition)
- **AI Agents** (memory management, preference learning)
- **n8n Automation** (scheduled workflows, integrations)
- **Applied LLM Engineering** (context windows, conversation flow)

### Concrete Value Proposition

**Accessibility**: Hands-free shopping list creation (crucial for 25% of population)
**Time Efficiency**: Create lists 3x faster than typing
**Smart Features**: Auto-complete, quantity suggestions, seasonal awareness
**Family Sync**: Shared lists with real-time updates

### Development Phases

#### Phase 1: Voice Processing Pipeline (Week 1-2)

**Specification-Driven Development**:

```yaml
Voice Command Examples:
  - "Add 2 liters of milk"
  - "הוסף קילו עגבניות" (Add a kilo of tomatoes)
  - "Remove bread from the list"
  - "What's on my list?"
  - "Find the cheapest place to shop"
```

**TODOs with TDD Approach**:

- [ ] TODO: Integrate Whisper API
  ```python
  def test_speech_to_text():
      audio = load_audio("test_hebrew.wav")
      text = whisper_transcribe(audio)
      assert text == "הוסף שני ליטר חלב"
      # Test noise handling
      noisy_audio = add_background_noise(audio)
      text_noisy = whisper_transcribe(noisy_audio)
      assert similarity(text, text_noisy) > 0.8
  ```
- [ ] TODO: Implement language detection
  - Test: Detect Hebrew vs English
  - Test: Handle code-switching (mixed languages)
  - Test: Default to user's preferred language
- [ ] TODO: Create entity extraction
  ```python
  def test_entity_parser():
      parser = ShoppingEntityParser()
      entities = parser.parse("Add 2kg of apples and 3 bottles of water")
      assert entities[0] == {
          "item": "apples",
          "quantity": 2,
          "unit": "kg",
          "action": "add"
      }
      assert len(entities) == 2
  ```
- [ ] TODO: Build quantity normalization
  - Test: Convert "שני" → 2
  - Test: Handle "a dozen" → 12
  - Test: Normalize units (pounds → kg)
- [ ] TODO: Implement text-to-speech
  ```python
  def test_text_to_speech():
      audio = generate_speech("Added milk to your list")
      assert audio.duration < 3  # seconds
      assert audio.format == "mp3"
      # Test Hebrew
      audio_he = generate_speech("נוסף לרשימה")
      assert audio_he.language == "he"
  ```

#### Phase 2: Smart List Management (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Create list persistence layer
  ```python
  def test_list_operations():
      list_mgr = ShoppingListManager(user_id="123")
      list_mgr.add_item("milk", quantity=2)
      list_mgr.add_item("bread")
      assert len(list_mgr.get_items()) == 2
      list_mgr.remove_item("milk")
      assert len(list_mgr.get_items()) == 1
      # Test persistence
      list_mgr2 = ShoppingListManager(user_id="123")
      assert len(list_mgr2.get_items()) == 1
  ```
- [ ] TODO: Implement smart suggestions
  - Test: Suggest commonly paired items
  - Test: Seasonal recommendations
  - Test: Learn from purchase history
- [ ] TODO: Build price optimization
  ```python
  def test_list_optimization():
      optimizer = ListOptimizer()
      result = optimizer.optimize(
          items=["milk", "bread", "eggs"],
          location="Tel Aviv",
          max_stores=2
      )
      assert result.total_cost < individual_store_costs
      assert len(result.store_assignments) <= 2
  ```
- [ ] TODO: Add dietary filtering
  - Test: Filter by kosher/halal/vegan
  - Test: Allergen warnings
  - Test: Nutritional preferences
- [ ] TODO: Create reminders system
  ```python
  def test_shopping_reminders():
      reminder = ReminderSystem()
      # Test recurring items
      reminder.analyze_patterns(user_history)
      suggestion = reminder.get_suggestions()
      assert "milk" in suggestion  # User buys weekly
      # Test location-based reminders
      reminder.user_near_store("Shufersal")
      assert reminder.should_notify() == True
  ```

#### Phase 3: Integration & Production (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Build mobile app API
  ```python
  def test_mobile_api():
      # Test voice upload
      response = client.post("/voice/upload",
          files={"audio": audio_file}
      )
      assert response.status_code == 200
      assert "transcription" in response.json()
      # Test real-time sync
      ws = websocket.connect("/lists/sync")
      ws.send({"action": "add", "item": "milk"})
      update = ws.receive()
      assert update["type"] == "list_updated"
  ```
- [ ] TODO: Implement family sharing
  - Test: Multiple users edit same list
  - Test: Conflict resolution (simultaneous edits)
  - Test: Permission levels (view/edit/admin)
- [ ] TODO: Create n8n automations
  ```yaml
  Workflow Tests:
    - Daily: Check for recurring items
    - Trigger: Near store location → send notification
    - Weekly: Generate shopping analytics
    - Integration: Sync with calendar
  ```
- [ ] TODO: Add offline support
  ```python
  def test_offline_mode():
      app = ShoppingApp(offline=True)
      app.add_item("milk")  # Stored locally
      app.add_item("bread")
      # Simulate going online
      app.sync()
      assert server.get_list() == ["milk", "bread"]
  ```
- [ ] TODO: Deploy voice service
  - Test: Handle 100 concurrent voice streams
  - Test: Latency < 2 seconds end-to-end
  - Test: Graceful degradation without internet
- [ ] TODO: Create analytics dashboard
  ```python
  def test_user_analytics():
      analytics = UserAnalytics(user_id="123")
      stats = analytics.get_monthly_stats()
      assert stats["avg_list_size"] > 0
      assert stats["favorite_items"] != []
      assert stats["shopping_frequency"] > 0
  ```

---

## Project 8: Inflation Tracker & Trend Analyzer

### Syllabus Topics Covered

- **Time-Series Analysis** (forecasting, seasonality, trend detection)
- **Machine Learning** (regression, feature engineering, ensemble methods)
- **Model Reasoning** (explainable AI, SHAP values, feature importance)
- **Data Visualization** (dashboards, interactive charts)
- **FastAPI** (REST APIs, async endpoints, WebSocket support)

### Concrete Value Proposition

**Economic Intelligence**: Track real inflation vs. official statistics
**Investment Decisions**: Data for retail investors and businesses
**Policy Insights**: Evidence for consumer advocacy and regulation
**Budget Planning**: Predict future costs for households and businesses

### Development Phases

#### Phase 1: Data Pipeline & Metrics (Week 1-2)

**Specification-Driven Development**:

```yaml
Inflation Metrics:
  - CPI Basket: Track standard consumer goods
  - Category Inflation: Dairy, Meat, Produce, etc.
  - Chain Comparison: Price changes by retailer
  - Regional Variation: Geographic price differences

API Endpoints: GET /inflation/current
  GET /inflation/history?period=12months
  GET /inflation/forecast?horizon=3months
  GET /products/{id}/price-history
```

**TODOs with TDD Approach**:

- [ ] TODO: Build price tracking system
  ```python
  def test_price_tracker():
      tracker = PriceTracker()
      # Add historical prices
      tracker.add_price("milk_tnuva", date(2024, 1, 1), 6.5)
      tracker.add_price("milk_tnuva", date(2024, 11, 1), 7.8)
      inflation = tracker.calculate_inflation("milk_tnuva")
      assert inflation == pytest.approx(0.20, 0.01)  # 20% inflation
  ```
- [ ] TODO: Create CPI basket definition
  - Test: Include essential items
  - Test: Weight by consumption patterns
  - Test: Update seasonally
- [ ] TODO: Implement outlier detection
  ```python
  def test_outlier_detection():
      detector = PriceAnomalyDetector()
      prices = [10, 10.5, 11, 50, 11.5]  # 50 is outlier
      outliers = detector.detect(prices)
      assert outliers == [3]  # Index of outlier
      # Test gradual increases not flagged
      gradual = [10, 12, 14, 16, 18]
      assert detector.detect(gradual) == []
  ```
- [ ] TODO: Design time-series database
  - Test: Efficient range queries
  - Test: Compression for historical data
  - Test: Aggregation performance
- [ ] TODO: Calculate derived metrics
  ```python
  def test_inflation_metrics():
      calculator = InflationCalculator()
      metrics = calculator.calculate(
          product="bread",
          period="2024-Q1"
      )
      assert "month_over_month" in metrics
      assert "year_over_year" in metrics
      assert "volatility" in metrics
  ```

#### Phase 2: Forecasting & Analysis (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Implement ARIMA forecasting
  ```python
  def test_arima_forecast():
      model = ARIMAForecaster()
      historical = get_price_history("milk", days=365)
      forecast = model.predict(historical, horizon=30)
      assert len(forecast) == 30
      # Test confidence intervals
      assert all(f.lower_bound < f.prediction < f.upper_bound
                for f in forecast)
  ```
- [ ] TODO: Build XGBoost predictor
  - Test: Include seasonal features
  - Test: Add economic indicators
  - Test: Cross-validation performance
- [ ] TODO: Create trend analyzer
  ```python
  def test_trend_detection():
      analyzer = TrendAnalyzer()
      prices = generate_upward_trend()
      trend = analyzer.analyze(prices)
      assert trend.direction == "increasing"
      assert trend.slope > 0
      assert trend.r_squared > 0.8
  ```
- [ ] TODO: Implement correlation analysis
  - Test: Find correlated products
  - Test: Identify leading indicators
  - Test: Detect seasonal patterns
- [ ] TODO: Add explainable AI
  ```python
  def test_model_explanation():
      explainer = ModelExplainer(model)
      explanation = explainer.explain(
          prediction=15.5,
          features={"month": 12, "promo": False}
      )
      assert "feature_importance" in explanation
      assert explanation.top_factor == "month"  # December prices
  ```

#### Phase 3: Dashboard & API (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Create interactive dashboard
  ```javascript
  test('Inflation chart renders', () => {
    render(<InflationDashboard />);
    const chart = screen.getByTestId('inflation-chart');
    expect(chart).toBeVisible();
    // Test interactivity
    fireEvent.click(screen.getByText('Dairy'));
    expect(chart).toHaveAttribute('data-category', 'dairy');
  });
  ```
- [ ] TODO: Build comparison tools
  - Test: Compare chains side-by-side
  - Test: Regional price maps
  - Test: Historical overlays
- [ ] TODO: Implement FastAPI endpoints

  ```python
  def test_api_endpoints():
      # Current inflation
      response = client.get("/inflation/current")
      assert response.json()["rate"] > 0

      # Forecast
      response = client.get("/inflation/forecast?horizon=3")
      assert len(response.json()["predictions"]) == 3
  ```

- [ ] TODO: Add WebSocket streaming
  ```python
  def test_realtime_updates():
      ws = websocket.connect("/ws/prices")
      update = ws.receive_json()
      assert "product_id" in update
      assert "new_price" in update
      assert update["timestamp"] is not None
  ```
- [ ] TODO: Create export functionality
  - Test: Export to CSV/Excel
  - Test: Generate PDF reports
  - Test: API data downloads
- [ ] TODO: Deploy with caching

  ```python
  def test_cache_performance():
      # First request - cache miss
      t1 = time.time()
      response1 = client.get("/inflation/history?period=12")
      duration1 = time.time() - t1

      # Second request - cache hit
      t2 = time.time()
      response2 = client.get("/inflation/history?period=12")
      duration2 = time.time() - t2

      assert duration2 < duration1 / 10  # 10x faster
  ```

---

## Project 9: Automated Report Generator for Grocery Trends

### Syllabus Topics Covered

- **Prompt Engineering** (chain-of-thought, structured generation)
- **n8n Automation** (scheduled workflows, error handling)
- **Model Reasoning** (multi-step analysis, insight generation)
- **From Code to Production** (deployment, monitoring, maintenance)
- **Applied LLM Engineering** (batching, cost optimization)

### Concrete Value Proposition

**Business Intelligence**: Weekly market insights without analyst hours
**Media Content**: Automated reports for news outlets (₪50K+ value/year)
**Regulatory Compliance**: Regular pricing transparency reports
**Competitive Analysis**: Track competitor strategies automatically

### Development Phases

#### Phase 1: Data Aggregation Pipeline (Week 1-2)

**Specification-Driven Development**:

```yaml
Report Structure: 1. Executive Summary
  2. Price Movement Analysis
  3. Promotional Activity
  4. Regional Variations
  5. Category Deep-Dives
  6. Predictions & Recommendations

Delivery Channels:
  - Email (PDF attachment)
  - Web Dashboard
  - API Endpoint
  - Slack/Teams Integration
```

**TODOs with TDD Approach**:

- [ ] TODO: Create data aggregation jobs
  ```python
  def test_weekly_aggregation():
      aggregator = WeeklyAggregator()
      data = aggregator.run(
          start_date=date(2024, 11, 1),
          end_date=date(2024, 11, 7)
      )
      assert data["products_analyzed"] > 100000
      assert data["chains_covered"] > 30
      assert "top_increases" in data
      assert "top_decreases" in data
  ```
- [ ] TODO: Calculate trend metrics
  - Test: Week-over-week changes
  - Test: Moving averages
  - Test: Volatility indices
- [ ] TODO: Identify significant events
  ```python
  def test_event_detection():
      detector = EventDetector()
      events = detector.analyze(weekly_data)
      # Should detect major price changes
      assert any(e.type == "price_spike" for e in events)
      assert all(e.significance > 0.7 for e in events)
  ```
- [ ] TODO: Build comparison engine
  - Test: Chain vs. chain analysis
  - Test: Category rankings
  - Test: YoY comparisons
- [ ] TODO: Create statistical summaries
  ```python
  def test_statistics_generation():
      stats = generate_statistics(price_data)
      assert stats["mean"] > 0
      assert stats["median"] > 0
      assert stats["std_dev"] > 0
      assert stats["percentiles"][90] > stats["percentiles"][10]
  ```

#### Phase 2: LLM Report Generation (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Design prompt templates
  ```python
  def test_prompt_generation():
      generator = PromptGenerator()
      prompt = generator.create_analysis_prompt(weekly_data)
      assert "price changes" in prompt
      assert "insights" in prompt
      assert len(prompt) < 4000  # Token limit
  ```
- [ ] TODO: Implement Chain-of-Thought
  - Test: Multi-step reasoning visible
  - Test: Conclusions follow from data
  - Test: No hallucinated statistics
- [ ] TODO: Create structured outputs
  ```python
  def test_structured_generation():
      llm = ReportGenerator()
      report = llm.generate(data)
      # Validate structure
      assert report["executive_summary"]
      assert len(report["key_findings"]) >= 3
      assert report["recommendations"]
      # Verify factual accuracy
      assert verify_statistics(report, source_data)
  ```
- [ ] TODO: Build section generators
  - Test: Executive summary conciseness
  - Test: Technical sections accuracy
  - Test: Narrative flow and coherence
- [ ] TODO: Add data visualization
  ```python
  def test_chart_generation():
      charter = ChartGenerator()
      chart = charter.create_price_trend(product_data)
      assert chart.type == "line"
      assert chart.has_labels()
      assert chart.export_format in ["png", "svg"]
  ```

#### Phase 3: Automation & Delivery (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Create n8n workflow
  ```yaml
  Workflow Test:
    Triggers:
      - Cron: Every Sunday 6 AM
    Steps:
      1. Aggregate data (timeout: 5 min)
      2. Generate report (timeout: 10 min)
      3. Create PDF (timeout: 2 min)
      4. Send emails (retry: 3 times)
    Error Handling:
      - Notify admin on failure
      - Store partial results
      - Retry with backoff
  ```
- [ ] TODO: Implement PDF generation
  ```python
  def test_pdf_creation():
      pdf_gen = PDFGenerator()
      pdf = pdf_gen.create(report_data)
      assert pdf.page_count > 5
      assert pdf.has_table_of_contents()
      assert pdf.file_size < 10_000_000  # 10MB
  ```
- [ ] TODO: Build distribution system
  - Test: Email delivery with attachments
  - Test: Web dashboard update
  - Test: API endpoint availability
- [ ] TODO: Add subscriber management
  ```python
  def test_subscription_system():
      subs = SubscriptionManager()
      subs.add("user@example.com", preferences={
          "frequency": "weekly",
          "categories": ["dairy", "produce"]
      })
      recipients = subs.get_recipients("weekly")
      assert len(recipients) > 0
  ```
- [ ] TODO: Create monitoring
  ```python
  def test_report_monitoring():
      monitor = ReportMonitor()
      status = monitor.check_latest()
      assert status["generated"] == True
      assert status["delivered"] == True
      assert status["errors"] == []
      assert status["generation_time"] < 600  # 10 minutes
  ```
- [ ] TODO: Deploy with failover
  - Test: Backup generation service
  - Test: Queue persistence
  - Test: Partial failure recovery

---

## Project 10: Personalized Budget Assistant with Memory

### Syllabus Topics Covered

- **AI Agents** (memory systems, tool orchestration, planning)
- **Prompt Engineering** (personalization, context management)
- **LLM Integration** (extended context, structured data)
- **Ethics & Security** (privacy, data protection, bias mitigation)
- **From Code to Production** (GDPR compliance, encryption)

### Concrete Value Proposition

**Financial Health**: Help users save 20-30% on grocery spending
**Personalization**: Adaptive recommendations improve over time
**Privacy-First**: Local data storage with user control
**Family Budgeting**: Manage household expenses effectively

### Development Phases

#### Phase 1: Agent Architecture & Memory (Week 1-2)

**Specification-Driven Development**:

```yaml
Agent Capabilities:
  - Track spending history
  - Learn preferences
  - Budget allocation
  - Savings recommendations
  - Dietary respect

Memory Types:
  - Short-term: Current conversation
  - Long-term: User preferences, history
  - Episodic: Specific shopping trips
```

**TODOs with TDD Approach**:

- [ ] TODO: Design memory system

  ```python
  def test_agent_memory():
      memory = AgentMemory(user_id="123")
      memory.add_preference("brand", "Tnuva")
      memory.add_restriction("dietary", "vegetarian")

      # Test persistence
      memory2 = AgentMemory(user_id="123")
      assert memory2.get_preference("brand") == "Tnuva"

      # Test memory decay
      old_pref = memory.add_preference("store", "Shufersal",
                                      timestamp=days_ago(60))
      assert memory.get_confidence("store") < 0.5
  ```

- [ ] TODO: Implement preference learning
  - Test: Learn from feedback
  - Test: Adapt to changes
  - Test: Handle contradictions
- [ ] TODO: Create budget tracker

  ```python
  def test_budget_management():
      budget = BudgetManager(monthly_limit=2000)
      budget.add_purchase(500, date(2024, 11, 1))
      budget.add_purchase(300, date(2024, 11, 5))

      status = budget.get_status()
      assert status["spent"] == 800
      assert status["remaining"] == 1200
      assert status["projected_overage"] == 0
  ```

- [ ] TODO: Build planning system
  - Test: Multi-week meal planning
  - Test: Budget distribution
  - Test: Seasonal adjustments
- [ ] TODO: Design tool interfaces

  ```python
  def test_agent_tools():
      agent = BudgetAssistant()
      tools = agent.get_tools()
      assert "price_checker" in tools
      assert "promotion_finder" in tools
      assert "budget_analyzer" in tools

      result = agent.use_tool("price_checker", product="milk")
      assert result["success"] == True
  ```

#### Phase 2: Personalization & Intelligence (Week 3-4)

**TODOs with TDD Approach**:

- [ ] TODO: Implement recommendation engine

  ```python
  def test_personalized_recommendations():
      agent = BudgetAssistant(user_id="123")
      # User history shows vegetarian preference
      recs = agent.recommend_products(category="protein")
      assert "tofu" in recs
      assert "chicken" not in recs

      # Budget awareness
      recs_budget = agent.recommend_products(max_price=50)
      assert all(p.price <= 50 for p in recs_budget)
  ```

- [ ] TODO: Create feedback loop
  - Test: Positive/negative feedback processing
  - Test: Preference weight adjustment
  - Test: Exploration vs exploitation
- [ ] TODO: Build savings optimizer
  ```python
  def test_savings_optimization():
      optimizer = SavingsOptimizer()
      result = optimizer.analyze(shopping_list, budget=500)
      assert result.total_cost <= 500
      assert result.savings > 0
      assert result.substitutions != []
  ```
- [ ] TODO: Add nutritional awareness
  - Test: Track macro nutrients
  - Test: Suggest balanced meals
  - Test: Respect health goals
- [ ] TODO: Implement adaptive prompting

  ```python
  def test_adaptive_conversation():
      agent = BudgetAssistant()
      # New user - more explanation
      response1 = agent.respond("Help me save money", new_user=True)
      assert "how it works" in response1.lower()

      # Experienced user - concise
      response2 = agent.respond("Help me save money", new_user=False)
      assert len(response2) < len(response1)
  ```

#### Phase 3: Security & Production (Week 5-6)

**TODOs with TDD Approach**:

- [ ] TODO: Implement encryption

  ```python
  def test_data_encryption():
      storage = SecureStorage()
      storage.save("preferences", {"budget": 2000})

      # Data encrypted at rest
      raw_data = read_file_directly("user_data.db")
      assert "2000" not in str(raw_data)

      # Correct decryption
      data = storage.load("preferences")
      assert data["budget"] == 2000
  ```

- [ ] TODO: Add privacy controls
  - Test: Data export functionality
  - Test: Data deletion (GDPR)
  - Test: Consent management
- [ ] TODO: Create audit logging

  ```python
  def test_audit_trail():
      audit = AuditLogger()
      audit.log("data_access", user="123", resource="budget")

      logs = audit.get_logs(user="123")
      assert len(logs) > 0
      assert logs[0]["action"] == "data_access"
      assert logs[0]["timestamp"] is not None
  ```

- [ ] TODO: Implement bias detection
  - Test: No discrimination by demographics
  - Test: Fair recommendations across groups
  - Test: Transparent decision making
- [ ] TODO: Build production API

  ```python
  def test_production_security():
      # Test rate limiting
      for _ in range(101):
          response = client.post("/assistant/query")
      assert response.status_code == 429

      # Test authentication
      response = client.post("/assistant/query",
                           headers={"Auth": "invalid"})
      assert response.status_code == 401

      # Test input validation
      response = client.post("/assistant/query",
                           json={"budget": -1000})
      assert response.status_code == 400
  ```

- [ ] TODO: Deploy with monitoring
  - Test: Track user satisfaction
  - Test: Monitor model drift
  - Test: Alert on anomalies

---

## Project Comparison Matrix

| Project              | Difficulty | Core Skills            | Time to MVP | Business Value       | Learning Priority    |
| -------------------- | ---------- | ---------------------- | ----------- | -------------------- | -------------------- |
| 1. Price Agent       | Medium     | Agents, LLM, NLP       | 2 weeks     | High (25% savings)   | High - Foundational  |
| 2. RAG Analyzer      | Hard       | RAG, ML, Vector DB     | 3 weeks     | Medium (B2B)         | High - Advanced      |
| 3. Receipt Assistant | Medium     | Multimodal, n8n        | 2 weeks     | High (Consumer)      | Medium - Practical   |
| 4. Price Dashboard   | Hard       | Infrastructure, Docker | 3 weeks     | High (Transparency)  | High - Production    |
| 5. Chatbot           | Medium     | MCP, Chatbots          | 2 weeks     | High (UX)            | High - Modern        |
| 6. Classifier        | Easy       | ML, NLP                | 1 week      | Medium (Efficiency)  | High - Foundational  |
| 7. Voice List        | Medium     | Speech, NLP            | 2 weeks     | High (Accessibility) | Medium - Specialized |
| 8. Inflation Tracker | Hard       | Time-series, ML        | 3 weeks     | High (Economic)      | Medium - Analytics   |
| 9. Report Generator  | Medium     | Prompting, n8n         | 2 weeks     | Medium (Automation)  | High - Practical     |
| 10. Budget Assistant | Hard       | Agents, Ethics         | 4 weeks     | Very High (Personal) | High - Capstone      |

## Recommended Learning Paths

### Path 1: ML Foundations → LLM Integration

**Sequence**: Project 6 → 1 → 2 → 5 → 10
**Focus**: Build ML skills, then add AI agents

### Path 2: Production Engineering Focus

**Sequence**: Project 4 → 9 → 3 → 8 → 10
**Focus**: Infrastructure, monitoring, deployment

### Path 3: Applied AI Products

**Sequence**: Project 1 → 5 → 7 → 3 → 10
**Focus**: User-facing applications

### Path 4: Full Stack AI Engineer

**Sequence**: Project 6 → 2 → 4 → 9 → 10
**Focus**: Complete skill coverage

## Success Metrics

Each project should achieve:

- **Code Coverage**: > 80% test coverage
- **Performance**: Response time < 2 seconds
- **Accuracy**: Model/AI accuracy > 85%
- **User Value**: Measurable savings or efficiency gain
- **Production Ready**: Deployed with monitoring
- **Documentation**: Complete API docs and user guides

## Conclusion

These 10 projects provide comprehensive coverage of the AI Engineer Syllabus while building practical, valuable tools for the grocery/retail sector. Each project can be developed independently or combined into a larger ecosystem of intelligent grocery tools.

The Israeli Supermarkets dataset provides the perfect foundation with its:

- Real-world complexity and scale
- Multi-language challenges
- Rich temporal and geographic features
- Direct consumer relevance
- Production-level data engineering requirements

Students completing these projects will gain hands-on experience with:

- Classical ML and modern AI techniques
- Production deployment and monitoring
- Real-world data challenges
- Ethical AI and privacy considerations
- Full-stack AI engineering skills

Start with projects aligned to your current skill level and interests, then progressively tackle more complex challenges. The modular nature allows for continuous learning while building a portfolio of practical AI applications.
