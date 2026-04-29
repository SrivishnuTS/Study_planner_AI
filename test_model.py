import os, pytest, json, pandas as pd
from collections import Counter
from unittest.mock import patch
import mongomock
from train import generate_dataset, train_model
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    import app as myapp
    myapp.mongo_client = None
    with patch('app.MongoClient', mongomock.MongoClient):
        with app.test_client() as client: 
            yield client

def test_pipeline():
    test_path = 'data/test_data_pipeline.csv'
    if os.path.exists(test_path): os.remove(test_path)
    
    generate_dataset(test_path, n_samples_per_class=50)
    assert os.path.exists(test_path)
    
    df = pd.read_csv(test_path)
    counts = Counter(df['target'])
    assert counts['Pomodoro'] == 50
    assert counts['Deep Work'] == 50
    assert counts['Spaced Repetition'] == 50
    
    # Assert new columns exist
    assert 'course_name' in df.columns
    assert 'energy_level' in df.columns
    
    if os.path.exists('model/data_hash.txt'): os.remove('model/data_hash.txt')
    train_model()
    
    assert os.path.exists('model/model.pkl')
    with open('model/model_metrics.json') as f:
        metrics = json.load(f)
        assert metrics['models_compared']['RandomForest']['accuracy'] > 0.70

def test_scenario_diversity_and_overrides(client):
    """
    Tests model diversity and the new rule-based post-processing overrides.
    """
    # Scenario A: High difficulty + low energy -> Pomodoro tendency
    res_a = client.post('/api/v1/predict', json={
        "study_hours":2.0, "break_time":1.0, "sleep_hours":6.0, "focus_score":3.0, 
        "distraction_level":"high", "day_of_week":"Wednesday", "previous_score":50,
        "course_difficulty": "high", "energy_level": "Low", "study_goal_type": "Exam Preparation"
    })
    
    # Scenario B: High focus + Concept Learning -> Deep Work tendency
    res_b = client.post('/api/v1/predict', json={
        "study_hours":8.0, "break_time":0.5, "sleep_hours":8.0, "focus_score":9.0, 
        "distraction_level":"low", "day_of_week":"Monday", "previous_score":90,
        "course_difficulty": "medium", "energy_level": "High", "study_goal_type": "Concept Learning"
    })
    
    # Scenario C: Revision + good sleep -> Spaced Repetition tendency
    res_c = client.post('/api/v1/predict', json={
        "study_hours":4.0, "break_time":1.0, "sleep_hours":9.0, "focus_score":6.0, 
        "distraction_level":"low", "day_of_week":"Sunday", "previous_score":80,
        "course_difficulty": "low", "energy_level": "Medium", "study_goal_type": "Revision"
    })
    
    assert res_a.status_code == 200, res_a.get_json()
    assert res_b.status_code == 200, res_b.get_json()
    assert res_c.status_code == 200, res_c.get_json()
    
    data_a = res_a.get_json()
    data_b = res_b.get_json()
    data_c = res_c.get_json()
    
    # Assert override rationale exists in explanation engine
    assert any("energy is low and difficulty is high" in reason for reason in data_a['explanation_reasons'])
    assert any("uninterrupted work is highly suitable for learning new concepts" in reason for reason in data_b['explanation_reasons'])
    assert any("spaced review for long-term memory retention" in reason for reason in data_c['explanation_reasons'])
    
    # Assert model diversity
    predictions = {data_a['predicted_pattern'], data_b['predicted_pattern'], data_c['predicted_pattern']}
    assert len(predictions) > 1, f"Model stuck predicting identical classes: {predictions}"

def test_endpoints_compatibility(client):
    payload = {
        "study_hours":4, "break_time":0.5, "sleep_hours":8, "focus_score":9, 
        "distraction_level":"low", "day_of_week":"Monday", "previous_score":85
    }
    # It should work without providing the new contextual fields (defaults should cover it)
    res = client.post('/predict', json=payload)
    assert res.status_code == 200, res.get_json()
    
    res_sim = client.post('/simulate', json=payload)
    assert res_sim.status_code == 200 and 'explanation' in res_sim.get_json()
    
    assert client.get('/analytics').status_code == 200
    assert client.get('/weekly-report').status_code == 200
