import os, pytest, json, pandas as pd
from collections import Counter
from unittest.mock import patch
import mongomock
from train import generate_dataset, train_model
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret'
    import app as myapp
    myapp.mongo_client = None
    with patch('app.MongoClient', mongomock.MongoClient):
        with app.test_client() as client: 
            yield client

def test_pipeline():
    test_path = 'data/test_data_pipeline.csv'
    if os.path.exists(test_path): os.remove(test_path)
    
    # Use small dataset for faster test
    generate_dataset(test_path, n_samples_per_class=10)
    assert os.path.exists(test_path)
    
    df = pd.read_csv(test_path)
    counts = Counter(df['target'])
    assert counts['Pomodoro'] == 10
    
    # Monkeypatch DATA_PATH in train.py to use our test data
    with patch('train.DATA_PATH', test_path):
        train_model(version="test-v1")
    
    assert os.path.exists('model/model.pkl')
    assert os.path.exists('model/model_metrics.json')
    
    with open('model/model_metrics.json') as f:
        metrics = json.load(f)
        assert 'accuracy' in metrics
        assert metrics['model_version'] == "test-v1"

def test_model_predictions(client):
    """Tests model prediction endpoint with various scenarios."""
    # Scenario: High focus, good sleep -> Likely Deep Work or Spaced Repetition
    res = client.post('/api/v1/predict', json={
        "study_hours": 6.0, "break_time": 0.2, "sleep_hours": 8.0, "focus_score": 9.0, 
        "distraction_level": "low", "day_of_week": "Monday", "previous_score": 90,
        "course_name": "Algorithms", "course_difficulty": "high", "study_goal_type": "Concept Learning",
        "energy_level": "High", "time_of_day": "Morning"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "predicted_pattern" in data
    assert data["confidence"] > 0

def test_protected_endpoints_auth(client):
    """Tests that protected endpoints require authentication."""
    assert client.get('/api/v1/history').status_code == 401
    assert client.get('/api/v1/analytics').status_code == 401
    assert client.get('/api/v1/weekly-report').status_code == 401
