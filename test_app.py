import pytest, json
from unittest.mock import patch
import mongomock
from app import app
from utils import engineer_features
import pandas as pd

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret'
    import app as myapp
    myapp.mongo_client = None
    # Use mongomock for testing
    with patch('app.MongoClient', mongomock.MongoClient):
        with app.test_client() as client:
            yield client

def test_formulas():
    data = {
        "study_hours": 4, "focus_score": 8, "previous_score": 80, "sleep_hours": 6,
        "break_time": 1, "distraction_level": "low", "day_of_week": "Monday"
    }
    df = engineer_features(pd.DataFrame([data]))
    # efficiency_base = (focus_score * previous_score) / study_hours
    # eff = (8 * 80) / 4 = 160.0
    assert float(df['efficiency_base'].iloc[0]) == 160.0
    # sleep_focus_ratio = sleep_hours / focus_score = 6 / 8 = 0.75
    assert float(df['sleep_focus_ratio'].iloc[0]) == 0.75

def test_predict_endpoint_structure(client):
    res = client.post('/api/v1/predict', json={
        "study_hours": 5, "break_time": 1, "sleep_hours": 8, "focus_score": 7,
        "distraction_level": "medium", "day_of_week": "Monday", "previous_score": 75,
        "course_name": "General", "course_difficulty": "medium", "study_goal_type": "Revision",
        "energy_level": "Medium", "time_of_day": "Morning"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "predicted_pattern" in data
    assert "confidence" in data
    assert "recommendation_details" in data
    assert "efficiency_score" in data
    assert "drift_detected" in data

def test_auth_flow(client):
    # 1. Signup
    res_signup = client.post('/api/v1/signup', json={
        "username": "testuser",
        "email": "test@test.com",
        "password": "securepassword123"
    })
    assert res_signup.status_code == 201
    
    # 2. Duplicate Signup
    res_dup = client.post('/api/v1/signup', json={
        "username": "testuser2",
        "email": "test@test.com",
        "password": "securepassword123"
    })
    assert res_dup.status_code == 400
    
    # 3. Login
    res_login = client.post('/api/v1/login', json={
        "email": "test@test.com",
        "password": "securepassword123"
    })
    assert res_login.status_code == 200
    token = res_login.get_json()["token"]
    assert token is not None
    
    # 4. Protected Endpoint
    headers = {"Authorization": f"Bearer {token}"}
    res_pred = client.post('/api/v1/predict-and-save', json={
        "study_hours": 3, "break_time": 0.5, "sleep_hours": 7, "focus_score": 8,
        "distraction_level": "low", "day_of_week": "Tuesday", "previous_score": 80,
        "course_name": "General", "course_difficulty": "medium", "study_goal_type": "Revision",
        "energy_level": "Medium", "time_of_day": "Morning"
    }, headers=headers)
    assert res_pred.status_code == 200
    assert "prediction_id" in res_pred.get_json()
    
    # 5. Fetch History
    res_hist = client.get('/api/v1/history', headers=headers)
    assert res_hist.status_code == 200
    history_data = res_hist.get_json()
    assert len(history_data) == 1

def test_analytics_endpoint(client):
    # Login first
    client.post('/api/v1/signup', json={
        "username": "analyst", "email": "analyst@test.com", "password": "password"
    })
    login_res = client.post('/api/v1/login', json={
        "email": "analyst@test.com", "password": "password"
    })
    token = login_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Save some data
    for i in range(3):
        client.post('/api/v1/predict-and-save', json={
            "study_hours": 4, "break_time": 1, "sleep_hours": 8, "focus_score": 7,
            "distraction_level": "low", "day_of_week": "Monday", "previous_score": 75,
            "course_name": "General", "course_difficulty": "medium", "study_goal_type": "Revision",
            "energy_level": "Medium", "time_of_day": "Morning"
        }, headers=headers)

    res = client.get('/api/v1/analytics', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data["data_points"] == 3
    assert "avg_efficiency" in data

def test_recommendation_details(client):
    # Low focus scenario
    res = client.post('/api/v1/predict', json={
        "study_hours": 4, "break_time": 1, "sleep_hours": 8, "focus_score": 2, # Low focus
        "distraction_level": "high", "day_of_week": "Monday", "previous_score": 50,
        "course_name": "General", "course_difficulty": "high", "study_goal_type": "Revision",
        "energy_level": "Low", "time_of_day": "Afternoon"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "focus is low" in data["recommendation_details"]["summary"].lower()
    assert data["weak_prediction"] is True
