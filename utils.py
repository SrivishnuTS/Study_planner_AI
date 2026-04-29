import pandas as pd

def engineer_features(df):
    """
    Consistent feature engineering for both training and inference.
    """
    df = df.copy()
    # Explicitly ensure columns exist and are numeric
    sh = df['study_hours'].astype(float).clip(lower=0.1)
    fs = df['focus_score'].astype(float).clip(lower=0.1)
    sl = df['sleep_hours'].astype(float)
    bt = df['break_time'].astype(float)
    ps = df['previous_score'].astype(float)
    
    df['efficiency_base'] = (fs * ps) / sh
    df['sleep_focus_ratio'] = sl / fs
    df['break_ratio'] = bt / sh
    df['distraction_penalty'] = df['distraction_level'].map({'low':1, 'medium':2, 'high':3}).fillna(2)
    df['weekend_flag'] = df['day_of_week'].isin(['Saturday', 'Sunday']).astype(int)
    
    # Return features in the order they were used in training (numeric first, then categorical)
    # The pipeline handles selection, but we ensure all columns are present
    return df
