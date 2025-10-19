# train_spam_model.py

import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib
import os

# Load dataset
DATA_PATH = os.path.join(os.path.dirname(__file__), "spam_data.csv")
df = pd.read_csv(DATA_PATH)

# Train ML pipeline
pipeline = Pipeline([
    ("vectorizer", CountVectorizer()),
    ("classifier", MultinomialNB())
])

pipeline.fit(df["message"], df["label"])

# Save model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "spam_classifier.joblib")
joblib.dump(pipeline, MODEL_PATH)
print("✅ Spam model trained and saved to:", MODEL_PATH)
