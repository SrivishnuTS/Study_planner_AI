import pytest, json
from unittest.mock import patch
import mongomock
from app import app, build_features

@pytest.fixture
def client():
    app.config['TESTING'] = True
    import app as myapp
    myapp.mongo_client = None
    with patch('app.MongoClient', mongomock.MongoClient):
        with app.test_client() as client:
            yield client

def test_formulas():
    data = {"study_hours": 4, "focus_score": 8, "previous_score": 80, "sleep_hours": 6}
    df, eff, sleep_focus, prev = build_features(data)
    assert eff == 160.0
    assert sleep_focus == 0.75

def test_validation_rejection(client):
    res = client.post('/api/v1/predict', json={
        "study_hours": -5, # Invalid negative
        "focus_score": 150 # Invalid scale
    })
    assert res.status_code == 400
    assert "Validation Error" in res.get_json()["error"]

def test_predict_endpoint_structure(client):
    res = client.post('/api/v1/predict', json={
        "user_id": "test_user_123",
        "study_hours": 5, "break_time": 1, "sleep_hours": 8, "focus_score": 7,
        "distraction_level": "medium", "day_of_week": "Monday", "previous_score": 75
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "predicted_pattern" in data
    assert "model_confidence_probability_estimate" in data
    assert "ranked_predictions" in data
    assert len(data["ranked_predictions"]) > 0
    assert "drift_detected" in data
    assert "prediction_id" in data

def test_predict_and_save_endpoint(client):
    res = client.post('/api/v1/predict-and-save', json={
        "user_id": "test_user_123",
        "study_hours": 3, "break_time": 0.5, "sleep_hours": 7, "focus_score": 8,
        "distraction_level": "low", "day_of_week": "Tuesday", "previous_score": 80
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "predicted_pattern" in data
    assert "model_confidence_probability_estimate" in data
    assert "prediction_id" in data

def test_low_confidence_warning(client):
    res = client.post('/api/v1/simulate', json={
        "study_hours": 5, "sleep_hours": 5, "focus_score": 5, "distraction_level": "medium", "day_of_week": "Monday", "break_time": 1, "previous_score": 50
    })
    data = res.get_json()
    if data["model_confidence_probability_estimate"] < 60:
        types = [a["type"] for a in data.get("alerts", [])]
        assert "low_confidence_warning" in types

def test_drift_detection(client):
    res = client.post('/api/v1/simulate', json={
        "study_hours": 24, # Extreme outlier but within validation bounds
        "focus_score": 10, "sleep_hours": 8, "distraction_level": "low", "previous_score": 80, "break_time": 1, "day_of_week": "Monday"
    })
    data = res.get_json()
    assert data["drift_detected"] is True
    assert data["drift_level"] in ["moderate", "significant"]

def test_feature_importance(client):
    res = client.get('/api/v1/feature-importance')
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) > 0
    assert "feature" in data[0]
    assert "importance" in data[0]

def test_feedback_endpoint(client):
    res = client.post('/api/v1/feedback', json={
        "prediction_id": 1,
        "user_id": "test_user_123",
        "success": True,
        "notes": "Worked well."
    })
    assert res.status_code == 200
    assert res.get_json()["status"] == "success"

def test_auth_flow(client):
    # 1. Signup
    res_signup = client.post('/api/v1/signup', json={
        "username": "testuser",
        "email": "test@test.com",
        "password": "securepassword123"
    })
    assert res_signup.status_code == 201
    
    # 2. Duplicate Signup Prevented
    res_dup = client.post('/api/v1/signup', json={
        "username": "testuser2",
        "email": "test@test.com",
        "password": "securepassword123"
    })
    assert res_dup.status_code == 409
    
    # 3. Login
    res_login = client.post('/api/v1/login', json={
        "email": "test@test.com",
        "password": "securepassword123"
    })
    assert res_login.status_code == 200
    token = res_login.get_json()["token"]
    assert token is not None
    
    # 4. Bad Login
    res_bad = client.post('/api/v1/login', json={
        "email": "test@test.com",
        "password": "wrongpassword"
    })
    assert res_bad.status_code == 401
    
    # 5. Protected Endpoint saving data
    headers = {"Authorization": f"Bearer {token}"}
    res_pred = client.post('/api/v1/predict-and-save', json={
        "study_hours": 3, "break_time": 0.5, "sleep_hours": 7, "focus_score": 8,
        "distraction_level": "low", "day_of_week": "Tuesday", "previous_score": 80
    }, headers=headers)
    assert res_pred.status_code == 200
    assert "prediction_id" in res_pred.get_json()
    
    # 6. Fetch History
    res_hist = client.get('/api/v1/history', headers=headers)
    assert res_hist.status_code == 200
    history_data = res_hist.get_json()
    assert len(history_data) == 1
    assert history_data[0]["user_id"] != "anonymous"

def test_recommendation_engine(client):
    # Test high distraction/low focus -> weak prediction + Pomodoro plan
    res = client.post('/api/v1/simulate', json={
        "study_hours": 4, "sleep_hours": 5, "focus_score": 3, "distraction_level": "high",
        "day_of_week": "Monday", "previous_score": 70, "study_goal_type": "Exam Preparation"
    })
    data = res.get_json()
    assert data["weak_prediction"] is True
    assert "Distraction level is currently high" in data["weak_prediction_reasons"]
    assert any("Pomodoro" in rec for rec in data["recommendations"]) or "Pomodoro" in data["study_plan"]
    assert "Pomodoro" in data["study_plan"]
    
    # Test optimal conditions -> Deep Work plan
    res_opt = client.post('/api/v1/simulate', json={
        "study_hours": 4, "sleep_hours": 8, "focus_score": 9, "distraction_level": "low",
        "day_of_week": "Monday", "previous_score": 85, "study_goal_type": "Concept Learning"
    })
    data_opt = res_opt.get_json()
    assert data_opt["weak_prediction"] is False
    assert "Deep Work" in data_opt["study_plan"]


def test_dynamic_analytics(client):
    # Save 5 low efficiency predictions
    for i in range(5):
        client.post("/api/v1/predict-and-save", json={
            "study_hours": 10, "focus_score": 1, "previous_score": 50, "distraction_level": "high"
        })
    
    # Save 5 high efficiency predictions
    for i in range(5):
        client.post("/api/v1/predict-and-save", json={
            "study_hours": 1, "focus_score": 10, "previous_score": 90, "distraction_level": "low"
        })
        
    res = client.get("/api/v1/analytics")
    data = res.get_json()
    
    assert data["data_points"] >= 10
    assert "trends" in data
    assert data["trends"]["avg_efficiency"]["direction"] == "up"
    assert data["trends"]["avg_efficiency"]["change_percent"] > 0

def test_structured_recommendations(client):
    # Case 1: Low Focus
    res_low = client.post('/api/v1/simulate', json={
        "study_hours": 2, "sleep_hours": 7, "focus_score": 3, "distraction_level": "low",
        "day_of_week": "Monday", "previous_score": 70, "study_goal_type": "Concept Learning"
    })
    data_low = res_low.get_json()
    assert "recommendation_details" in data_low
    details = data_low["recommendation_details"]
    assert "summary" in details
    assert "reduced attention capacity" in details["summary"]
    assert "25 minutes" in str(details["execution_plan"])
    assert "risk_alerts" in details

    # Case 2: Low Sleep
    res_sleep = client.post('/api/v1/simulate', json={
        "study_hours": 2, "sleep_hours": 4, "focus_score": 8, "distraction_level": "low",
        "day_of_week": "Monday", "previous_score": 70, "study_goal_type": "Concept Learning"
    })
    data_sleep = res_sleep.get_json()
    details_sleep = data_sleep["recommendation_details"]
    assert "sleep" in details_sleep["summary"].lower()
    assert any("retention" in r.lower() for r in details_sleep["risk_alerts"])

    # Case 3: High Distraction
    res_dist = client.post('/api/v1/simulate', json={
        "study_hours": 2, "sleep_hours": 8, "focus_score": 9, "distraction_level": "high",
        "day_of_week": "Monday", "previous_score": 70, "study_goal_type": "Concept Learning"
    })
    data_dist = res_dist.get_json()
    details_dist = data_dist["recommendation_details"]
    assert "Environmental factors" in details_dist["summary"]
    assert any("noise-canceling" in t.lower() for t in details_dist["optimization_tips"])

    # Case 4: Heavy Load
    res_heavy = client.post('/api/v1/simulate', json={
        "study_hours": 6, "sleep_hours": 8, "focus_score": 9, "distraction_level": "low",
        "day_of_week": "Monday", "previous_score": 70, "study_goal_type": "Concept Learning"
    })
    data_heavy = res_heavy.get_json()
    details_heavy = data_heavy["recommendation_details"]
    assert any("heavy study phase" in t.lower() for t in details_heavy["optimization_tips"])
