import os, json, joblib, hashlib
from collections import Counter
import pandas as pd, numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

DATA_PATH = 'data/student_study_data.csv'
MODEL_PATH = 'model/model.pkl'
METRICS_PATH = 'model/model_metrics.json'
STATS_PATH = 'model/reference_stats.json'
HASH_PATH = 'model/data_hash.txt'

def generate_dataset(output_path, n_samples_per_class=200, random_state=42):
    """
    Generates a balanced synthetic dataset for training.
    Uses strong academic logic to ensure class separation based on all inputs.
    """
    np.random.seed(random_state)
    records = []
    
    courses = [
        'Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 
        'Machine Learning', 'Artificial Intelligence', 'Software Engineering', 
        'Web Development', 'Cloud Computing', 'Cyber Security', 
        'Mathematics', 'Physics', 'Chemistry', 'General'
    ]
    
    # 1. Pomodoro: High difficulty, High distraction, Low Energy, or Low Focus
    for _ in range(n_samples_per_class):
        records.append({
            'course_name': np.random.choice(courses),
            'course_difficulty': np.random.choice(['high', 'medium'], p=[0.8, 0.2]),
            'study_goal_type': np.random.choice(['Concept Learning', 'Revision', 'Exam Preparation']),
            'energy_level': np.random.choice(['Low', 'Medium'], p=[0.9, 0.1]),
            'time_of_day': np.random.choice(['Morning', 'Afternoon', 'Night']),
            'study_hours': np.random.uniform(1.0, 3.0),
            'break_time': np.random.uniform(1.0, 3.0),
            'sleep_hours': np.random.uniform(4.0, 6.0),
            'focus_score': np.random.uniform(1.0, 5.0),
            'previous_score': np.random.uniform(40, 70),
            'distraction_level': np.random.choice(['high', 'medium'], p=[0.9, 0.1]),
            'day_of_week': np.random.choice(['Monday','Tuesday','Wednesday','Thursday','Friday']),
            'target': 'Pomodoro'
        })
        
    # 2. Deep Work: Concept Learning, High Focus, Low Distraction, High Energy
    for _ in range(n_samples_per_class):
        records.append({
            'course_name': np.random.choice(courses),
            'course_difficulty': np.random.choice(['medium', 'high']),
            'study_goal_type': 'Concept Learning',
            'energy_level': 'High',
            'time_of_day': np.random.choice(['Morning', 'Afternoon']),
            'study_hours': np.random.uniform(4.0, 8.0),
            'break_time': np.random.uniform(0.0, 0.5),
            'sleep_hours': np.random.uniform(7.0, 9.0),
            'focus_score': np.random.uniform(8.0, 10.0),
            'previous_score': np.random.uniform(70, 95),
            'distraction_level': 'low',
            'day_of_week': np.random.choice(['Monday','Tuesday','Wednesday','Thursday','Friday']),
            'target': 'Deep Work'
        })
        
    # 3. Spaced Repetition: Revision, Good Sleep, Weekends, Moderate Stats
    for _ in range(n_samples_per_class):
        records.append({
            'course_name': np.random.choice(courses),
            'course_difficulty': np.random.choice(['low', 'medium']),
            'study_goal_type': 'Revision',
            'energy_level': np.random.choice(['Medium', 'High']),
            'time_of_day': np.random.choice(['Afternoon', 'Night']),
            'study_hours': np.random.uniform(2.0, 5.0),
            'break_time': np.random.uniform(0.5, 1.5),
            'sleep_hours': np.random.uniform(7.5, 10.0),
            'focus_score': np.random.uniform(5.0, 8.0),
            'previous_score': np.random.uniform(60, 90),
            'distraction_level': np.random.choice(['low', 'medium']),
            'day_of_week': np.random.choice(['Friday', 'Saturday', 'Sunday']),
            'target': 'Spaced Repetition'
        })
        
    df = pd.DataFrame(records)
    df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[*] Generated dataset with {len(df)} records. Classes: {dict(Counter(df['target']))}")

from utils import engineer_features

import argparse
from datetime import datetime

def train_model(version="v1.0.0-dev"):
    if not os.path.exists(DATA_PATH): generate_dataset(DATA_PATH)
    
    df_raw = pd.read_csv(DATA_PATH)
    df = engineer_features(df_raw)
    X, y = df.drop('target', axis=1), df['target']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    num_f = ['study_hours', 'break_time', 'sleep_hours', 'focus_score', 'previous_score', 
             'efficiency_base', 'break_ratio', 'sleep_focus_ratio', 'distraction_penalty', 'weekend_flag']
    cat_f = ['distraction_level', 'day_of_week', 'course_name', 'course_difficulty', 'study_goal_type', 'energy_level', 'time_of_day']
    
    print(f"[*] Training with features: {num_f + cat_f}")

    preprocessor = ColumnTransformer([
        ('num', SimpleImputer(strategy='median'), num_f),
        ('cat', Pipeline([
            ('imp', SimpleImputer(strategy='most_frequent')), 
            ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ]), cat_f)
    ])
    
    rf = Pipeline([
        ('preprocessor', preprocessor), 
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42))
    ])
    
    rf.fit(X_train, y_train)
    
    # Save statistics for drift detection
    stats = {}
    for col in num_f:
        stats[col] = {
            "mean": float(df[col].mean()), "std": float(df[col].std()), 
            "min": float(df[col].min()), "max": float(df[col].max())
        }
    with open(STATS_PATH, 'w') as f: json.dump(stats, f)
    
    # Metrics
    rf_preds = rf.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_preds)
    print(f"[*] Model Retrained. Accuracy: {rf_acc*100:.1f}%")
    
    # Feature Importance
    classifier = rf.named_steps['classifier']
    importances = classifier.feature_importances_
    
    # Save structured metrics for CI/CD validation
    metrics = {
        "accuracy": float(rf_acc),
        "model_version": version,
        "training_timestamp": datetime.utcnow().isoformat(),
        "model_type": "RandomForestClassifier",
        "num_samples": len(df),
        "feature_importances": sorted(zip(num_f, [float(i) for i in importances[:len(num_f)]]), key=lambda x: x[1], reverse=True)
    }
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"[*] Saved metrics to {METRICS_PATH}")

    joblib.dump(rf, MODEL_PATH)
    
    # Data Hash
    with open(HASH_PATH, 'w') as f:
        with open(DATA_PATH, 'rb') as d:
            f.write(hashlib.md5(d.read()).hexdigest())

    # Scenario Verification
    print("\n[*] Dynamic Prediction Verification:")
    scenarios = [
        {"name": "Scenario A (Pomodoro)", "data": {"study_hours":2.0, "break_time":2.0, "sleep_hours":5.0, "focus_score":3.0, "previous_score":50, "distraction_level":"high", "day_of_week":"Monday", "course_name":"General", "course_difficulty":"high", "study_goal_type":"Revision", "energy_level":"Low", "time_of_day":"Afternoon"}},
        {"name": "Scenario B (Deep Work)", "data": {"study_hours":6.0, "break_time":0.2, "sleep_hours":8.0, "focus_score":9.5, "previous_score":90, "distraction_level":"low", "day_of_week":"Tuesday", "course_name":"Algorithms", "course_difficulty":"high", "study_goal_type":"Concept Learning", "energy_level":"High", "time_of_day":"Morning"}},
        {"name": "Scenario C (Spaced Rep)", "data": {"study_hours":4.0, "break_time":1.0, "sleep_hours":9.0, "focus_score":7.0, "previous_score":80, "distraction_level":"medium", "day_of_week":"Saturday", "course_name":"DBMS", "course_difficulty":"medium", "study_goal_type":"Revision", "energy_level":"Medium", "time_of_day":"Night"}}
    ]
    
    for s in scenarios:
        s_df = pd.DataFrame([s["data"]])
        s_df = engineer_features(s_df)
        pred = rf.predict(s_df)[0]
        print(f"  - {s['name']}: Predicted -> {pred}")

    
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--version', type=str, default="v1.0.0-dev", help="Model version string")
    args = parser.parse_args()
    train_model(version=args.version)
