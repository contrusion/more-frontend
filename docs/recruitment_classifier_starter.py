"""
Recruitment Email Classifier - Starter Template
A hierarchical classifier for recruitment emails using scikit-learn

Dataset structure expected:
- email_id: Unique identifier
- subject: Email subject line
- body_text: Full email body (or body_preview)
- from_email: Sender email
- label: Category label (outreach, cv_requested, etc.)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
import pickle
import re

# ============================================================================
# CONFIGURATION
# ============================================================================

# File paths
LABELED_CSV = 'data/recruitment_emails_labeled.csv'
TIER1_MODEL_PATH = 'models/tier1_classifier.pkl'
TIER2_MODEL_PATH = 'models/tier2_classifier.pkl'
TIER1_VECTORIZER_PATH = 'models/tier1_vectorizer.pkl'
TIER2_VECTORIZER_PATH = 'models/tier2_vectorizer.pkl'

# Label mapping
RECRUITMENT_LABELS = [
    'outreach', 'cv_requested', 'cv_submitted', 
    'interview_scheduled', 'interview_feedback', 'follow_up'
]

# ============================================================================
# DATA PREPROCESSING
# ============================================================================

def clean_text(text):
    """Clean and normalize email text"""
    if pd.isna(text):
        return ""
    
    # Convert to lowercase
    text = str(text).lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+', '', text)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove phone numbers (basic pattern)
    text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def combine_features(row):
    """Combine subject and body for better classification"""
    subject = clean_text(row.get('subject', ''))
    body = clean_text(row.get('body_text', '') or row.get('body_preview', ''))
    
    # Give more weight to subject by repeating it
    return f"{subject} {subject} {body}"

def load_and_prepare_data(csv_path):
    """Load labeled CSV and prepare features"""
    print(f"📂 Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    print(f"✅ Loaded {len(df)} emails")
    
    # Check for required columns
    required_cols = ['label']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    # Remove unlabeled rows
    df = df[df['label'].notna()]
    df = df[df['label'] != 'unlabeled']
    
    print(f"📊 Found {len(df)} labeled emails")
    
    # Create combined text feature
    df['text_combined'] = df.apply(combine_features, axis=1)
    
    # Create binary label for Tier 1 (recruitment vs non_recruitment)
    df['is_recruitment'] = df['label'].apply(
        lambda x: 'recruitment' if x in RECRUITMENT_LABELS else 'non_recruitment'
    )
    
    # Label distribution
    print("\n📈 Label Distribution:")
    print(df['label'].value_counts())
    print(f"\n🎯 Recruitment vs Non-recruitment:")
    print(df['is_recruitment'].value_counts())
    
    return df

# ============================================================================
# TIER 1: BINARY CLASSIFIER (Recruitment vs Non-recruitment)
# ============================================================================

def train_tier1_classifier(df):
    """Train binary classifier to detect recruitment emails"""
    print("\n" + "="*60)
    print("🚀 TIER 1: Training Binary Classifier")
    print("="*60)
    
    X = df['text_combined']
    y = df['is_recruitment']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"📚 Training set: {len(X_train)} emails")
    print(f"🧪 Test set: {len(X_test)} emails")
    
    # Vectorize text using TF-IDF
    print("\n🔄 Vectorizing text (TF-IDF)...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),  # Unigrams and bigrams
        min_df=2,  # Ignore very rare words
        stop_words='english'
    )
    
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # Train Logistic Regression
    print("🤖 Training Logistic Regression model...")
    model = LogisticRegression(
        max_iter=1000,
        class_weight='balanced',  # Handle class imbalance
        random_state=42
    )
    model.fit(X_train_vec, y_train)
    
    # Evaluate
    print("\n📊 Tier 1 Model Evaluation:")
    y_pred = model.predict(X_test_vec)
    print(classification_report(y_test, y_pred))
    
    print("\n🔍 Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save model and vectorizer
    print(f"\n💾 Saving Tier 1 model to {TIER1_MODEL_PATH}")
    with open(TIER1_MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    with open(TIER1_VECTORIZER_PATH, 'wb') as f:
        pickle.dump(vectorizer, f)
    
    return model, vectorizer

# ============================================================================
# TIER 2: MULTI-CLASS CLASSIFIER (Recruitment Categories)
# ============================================================================

def train_tier2_classifier(df):
    """Train multi-class classifier for recruitment email categories"""
    print("\n" + "="*60)
    print("🚀 TIER 2: Training Multi-class Classifier")
    print("="*60)
    
    # Filter only recruitment emails
    df_recruitment = df[df['is_recruitment'] == 'recruitment'].copy()
    
    print(f"📚 Training on {len(df_recruitment)} recruitment emails")
    
    # Check if we have enough data
    if len(df_recruitment) < 50:
        print("⚠️  WARNING: Very few recruitment emails. Model may not perform well.")
        print("   Recommendation: Label at least 100 recruitment emails")
    
    X = df_recruitment['text_combined']
    y = df_recruitment['label']
    
    # Check class distribution
    print("\n📊 Class distribution:")
    print(y.value_counts())
    
    # Warn about classes with few examples
    min_samples = y.value_counts().min()
    if min_samples < 10:
        print(f"\n⚠️  WARNING: Some classes have < 10 examples (min: {min_samples})")
        print("   Consider collecting more data for these categories")
    
    # Split data
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    except ValueError:
        # Fallback if stratify fails (too few samples)
        print("⚠️  Cannot stratify split. Using random split.")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
    
    print(f"📚 Training set: {len(X_train)} emails")
    print(f"🧪 Test set: {len(X_test)} emails")
    
    # Vectorize text
    print("\n🔄 Vectorizing text (TF-IDF)...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 3),  # Unigrams, bigrams, trigrams
        min_df=1,  # Keep all words (smaller dataset)
        stop_words='english'
    )
    
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # Train Logistic Regression
    print("🤖 Training Logistic Regression model...")
    model = LogisticRegression(
        max_iter=2000,
        class_weight='balanced',
        multi_class='multinomial',
        random_state=42
    )
    model.fit(X_train_vec, y_train)
    
    # Evaluate
    print("\n📊 Tier 2 Model Evaluation:")
    y_pred = model.predict(X_test_vec)
    print(classification_report(y_test, y_pred, zero_division=0))
    
    print("\n🔍 Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save model and vectorizer
    print(f"\n💾 Saving Tier 2 model to {TIER2_MODEL_PATH}")
    with open(TIER2_MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    with open(TIER2_VECTORIZER_PATH, 'wb') as f:
        pickle.dump(vectorizer, f)
    
    return model, vectorizer

# ============================================================================
# PREDICTION
# ============================================================================

def predict_email(subject, body, tier1_model, tier1_vec, tier2_model, tier2_vec):
    """Predict category for a new email"""
    # Combine and clean text
    text = clean_text(f"{subject} {subject} {body}")
    
    # Tier 1: Check if recruitment
    text_vec1 = tier1_vec.transform([text])
    is_recruitment = tier1_model.predict(text_vec1)[0]
    tier1_proba = tier1_model.predict_proba(text_vec1)[0]
    
    if is_recruitment == 'non_recruitment':
        return {
            'tier1': 'non_recruitment',
            'tier1_confidence': max(tier1_proba),
            'tier2': None,
            'tier2_confidence': None
        }
    
    # Tier 2: Classify recruitment category
    text_vec2 = tier2_vec.transform([text])
    category = tier2_model.predict(text_vec2)[0]
    tier2_proba = tier2_model.predict_proba(text_vec2)[0]
    
    return {
        'tier1': 'recruitment',
        'tier1_confidence': max(tier1_proba),
        'tier2': category,
        'tier2_confidence': max(tier2_proba)
    }

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main training pipeline"""
    print("🎯 Recruitment Email Classifier Training Pipeline")
    print("="*60)
    
    # Load data
    df = load_and_prepare_data(LABELED_CSV)
    
    # Train Tier 1 (Binary)
    tier1_model, tier1_vec = train_tier1_classifier(df)
    
    # Train Tier 2 (Multi-class)
    tier2_model, tier2_vec = train_tier2_classifier(df)
    
    print("\n" + "="*60)
    print("✅ Training Complete!")
    print("="*60)
    print(f"📁 Models saved:")
    print(f"   - {TIER1_MODEL_PATH}")
    print(f"   - {TIER2_MODEL_PATH}")
    print(f"   - {TIER1_VECTORIZER_PATH}")
    print(f"   - {TIER2_VECTORIZER_PATH}")
    
    # Test example
    print("\n🧪 Testing with example email:")
    example_subject = "Exciting opportunity at Tech Corp"
    example_body = "Hi, I came across your profile and think you'd be a great fit for our senior developer role."
    
    result = predict_email(
        example_subject, example_body, 
        tier1_model, tier1_vec, tier2_model, tier2_vec
    )
    
    print(f"\nSubject: {example_subject}")
    print(f"Prediction: {result}")

if __name__ == "__main__":
    # Create directories if they don't exist
    import os
    os.makedirs('models', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    
    main()
