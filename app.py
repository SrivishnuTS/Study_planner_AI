
def build_features(data):
    """Wrapper for engineer_features that processes raw data dict."""
    import pandas as pd
    df = pd.DataFrame([data])
    result_df = engineer_features(df)
    
    # Return the values needed by test_app.py
    eff = float(result_df['efficiency_base'].iloc[0])
    sleep_focus = float(result_df['sleep_focus_ratio'].iloc[0])
    prev = float(data.get('previous_score', 0))
    
    return result_df, eff, sleep_focus, prev
