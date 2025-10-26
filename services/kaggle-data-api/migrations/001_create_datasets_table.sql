-- Migration: Create datasets table
-- Description: Creates the datasets table with mock data for testing

-- Drop table if exists (for development)
DROP TABLE IF EXISTS datasets CASCADE;

-- Create datasets table
CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX idx_datasets_name ON datasets(name);

-- Create index on created_at for sorting
CREATE INDEX idx_datasets_created_at ON datasets(created_at DESC);

-- Insert mock data for testing
INSERT INTO datasets (name, title, description, url) VALUES
(
    'titanic',
    'Titanic: Machine Learning from Disaster',
    'Start here! Predict survival on the Titanic and get familiar with ML basics',
    'https://www.kaggle.com/c/titanic'
),
(
    'house-prices-advanced-regression-techniques',
    'House Prices - Advanced Regression Techniques',
    'Predict sales prices and practice feature engineering, RFs, and gradient boosting',
    'https://www.kaggle.com/c/house-prices-advanced-regression-techniques'
),
(
    'digit-recognizer',
    'Digit Recognizer',
    'Learn computer vision fundamentals with the famous MNIST data',
    'https://www.kaggle.com/c/digit-recognizer'
),
(
    'nlp-getting-started',
    'Natural Language Processing with Disaster Tweets',
    'Predict which Tweets are about real disasters and which ones are not',
    'https://www.kaggle.com/c/nlp-getting-started'
),
(
    'spaceship-titanic',
    'Spaceship Titanic',
    'Predict which passengers are transported to an alternate dimension',
    'https://www.kaggle.com/competitions/spaceship-titanic'
),
(
    'store-sales-time-series-forecasting',
    'Store Sales - Time Series Forecasting',
    'Use machine learning to predict grocery sales',
    'https://www.kaggle.com/c/store-sales-time-series-forecasting'
),
(
    'contradictory-my-dear-watson',
    'Contradictory, My Dear Watson',
    'Detect contradiction and entailment in multilingual text using TPUs',
    'https://www.kaggle.com/c/contradictory-my-dear-watson'
),
(
    'playground-series-s4e1',
    'Regression with a Crab Age Dataset',
    'Predict the age of crabs based on various features',
    'https://www.kaggle.com/competitions/playground-series-s4e1'
),
(
    'dogs-vs-cats',
    'Dogs vs. Cats',
    'Create an algorithm to distinguish dogs from cats',
    'https://www.kaggle.com/c/dogs-vs-cats'
),
(
    'tabular-playground-series-jan-2021',
    'Tabular Playground Series - Jan 2021',
    'Predict a continuous target based on a set of feature variables',
    'https://www.kaggle.com/c/tabular-playground-series-jan-2021'
);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the data
SELECT COUNT(*) as total_datasets FROM datasets;
