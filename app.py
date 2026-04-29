# Final Production-Grade Integrated app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import joblib, os, json, hashlib, logging
import pandas as pd, numpy as np
from datetime import datetime, timedelta
import bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
from utils import engineer_features
from functools import lru_cache

load_dotenv(override=True)

app = Flask(__name__)
CORS(app)

# Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "prod-secret-2026-secure")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
jwt = JWTManager(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MODEL_PATH = os.path.join('model', 'model.pkl')
METRICS_PATH = os.path.join('model', 'model_metrics.json')
STATS_PATH = os.path.join('model', 'reference_stats.json')

# Thresholds
CONFIDENCE_THRESHOLD = 60.0
FOCUS_THRESHOLD = 5.0
SLEEP_THRESHOLD = 6.0
DISTRACTION_THRESHOLD = "high"

# Database
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DB = os.getenv("MONGODB_DB", "study_ai_db")

mongo_client = None

def get_db():
    global mongo_client
    if mongo_client is None:
        mongo_client = MongoClient(MONGODB_URI)
    return mongo_client[MONGODB_DB]

# --- Auth Routes ---

@app.route('/api/v1/signup', methods=['POST'])
def signup():
    data = request.json
    db = get_db()
    if db["users"].find_one({"email": data['email']}):
        return jsonify({"error": "Email already registered"}), 400
    
    hashed_pw = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    db["users"].insert_one({
        "username": data['username'],
        "email": data['email'],
        "password_hash": hashed_pw,
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/v1/login', methods=['POST'])
def login():
    data = request.json
    db = get_db()
    user = db["users"].find_one({"email": data['email']})
    
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401
        
    identity = {"id": str(user["_id"]), "username": user["username"], "email": user["email"]}
    token = create_access_token(identity=identity)
    return jsonify({"token": token, "user": identity}), 200

# --- ML Logic ---

def check_data_drift(df_input):
    if not os.path.exists(STATS_PATH): return False, [], "none"
    with open(STATS_PATH, 'r') as f: stats = json.load(f)
    
    drift_detected = False
    drift_summary = []
    for col, s in stats.items():
        if col in df_input.columns:
            val = df_input[col].iloc[0]
            if val < s['min'] or val > s['max']:
                drift_detected = True
                drift_summary.append(f"{col} out of bounds")
    return drift_detected, drift_summary, "moderate" if drift_detected else "none"

def apply_rule_overrides(probas, classes, data):
    p = np.array(probas, copy=True)
    idx_map = {cls: i for i, cls in enumerate(classes)}
    
    # Simple example rule: High distraction -> Favors Pomodoro
    if data.get('distraction_level') == 'high' and 'Pomodoro' in idx_map:
        p[idx_map['Pomodoro']] += 0.1
    
    return p / np.sum(p)

def generate_recommendation_details(data, pattern, confidence, is_weak, weak_reasons):
    focus = float(data.get('focus_score', 5))
    sleep = float(data.get('sleep_hours', 7))
    
    summary = f"Optimal session: {pattern}. Conditions indicate moderate readiness."
    if focus < FOCUS_THRESHOLD: summary = "Focus is low. We suggest a structured break before starting."
    
    return {
        "summary": summary,
        "why_this_pattern_works": [f"Aligns with {data.get('course_difficulty', 'medium')} difficulty.", f"Matches {data.get('energy_level', 'High')} energy."],
        "execution_plan": ["Phase 1: Clear desk (5m)", f"Phase 2: {pattern} session (45m)", "Phase 3: Review summary (10m)"],
        "optimization_tips": ["Use noise-canceling audio.", "Keep hydration nearby."],
        "risk_alerts": weak_reasons if is_weak else ["No major risks."]
    }

@lru_cache(maxsize=1)
def load_ml_model():
    if not os.path.exists(MODEL_PATH): return None
    return joblib.load(MODEL_PATH)

def run_prediction(data):
    model = load_ml_model()
    if not model: raise Exception("Model missing.")
    
    df = engineer_features(pd.DataFrame([data]))
    drift_detected, drift_summary, drift_level = check_data_drift(df)
    
    probas = model.predict_proba(df)[0]
    probas = apply_rule_overrides(probas, model.classes_, data)
    
    best_idx = np.argmax(probas)
    pattern = model.classes_[best_idx]
    conf = float(probas[best_idx]) * 100
    
    weak_reasons = []
    if conf < CONFIDENCE_THRESHOLD: weak_reasons.append("Low confidence.")
    if float(data.get('focus_score', 5)) < FOCUS_THRESHOLD: weak_reasons.append("Low focus.")
    is_weak = len(weak_reasons) > 0
    
    rec_details = generate_recommendation_details(data, pattern, conf, is_weak, weak_reasons)
    
    return {
        "predicted_pattern": pattern,
        "confidence": round(conf, 1),
        "recommendation_details": rec_details,
        "efficiency_score": round(float(df['efficiency_base'].iloc[0]), 1),
        "weak_prediction": is_weak,
        "weak_prediction_reasons": weak_reasons,
        "drift_detected": drift_detected
    }

# --- API Endpoints ---

@app.route('/api/v1/predict', methods=['POST'])
@jwt_required(optional=True)
def predict_only():
    try:
        return jsonify(run_prediction(request.json))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/v1/predict-and-save', methods=['POST'])
@jwt_required()
def predict_and_save():
    try:
        user = get_jwt_identity()
        data = request.json
        res = run_prediction(data)
        
        db = get_db()
        ins = db["predictions"].insert_one({
            "user_id": user['id'],
            "input_parameters": data,
            "prediction_result": res,
            "created_at": datetime.utcnow()
        })
        res["prediction_id"] = str(ins.inserted_id)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/v1/history', methods=['GET'])
@jwt_required()
def history():
    user = get_jwt_identity()
    db = get_db()
    docs = db["predictions"].find({"user_id": user['id']}).sort("created_at", -1).limit(50)
    return jsonify([{
        "id": str(d["_id"]),
        "timestamp": d["created_at"].isoformat(),
        "predicted_pattern": d["prediction_result"]["predicted_pattern"],
        "confidence_score": d["prediction_result"]["confidence"],
        "efficiency_score": d["prediction_result"]["efficiency_score"],
        "efficiency_label": "High" if d["prediction_result"]["efficiency_score"] > 300 else "Medium",
        "study_hours": d["input_parameters"].get("study_hours"),
        "sleep_hours": d["input_parameters"].get("sleep_hours"),
        "focus_score": d["input_parameters"].get("focus_score"),
        "distraction_level": d["input_parameters"].get("distraction_level"),
        "explanation": d["prediction_result"]["recommendation_details"].get("summary"),
        "alerts": d["prediction_result"]["recommendation_details"].get("risk_alerts", [])
    } for d in docs])

@app.route('/api/v1/analytics', methods=['GET'])
@jwt_required()
def analytics():
    user = get_jwt_identity()
    db = get_db()
    docs = list(db["predictions"].find({"user_id": user['id']}).sort("created_at", -1))
    
    if not docs: return jsonify({"message": "No data", "data_points": 0})
    
    df = pd.DataFrame([{
        "eff": d["prediction_result"]["efficiency_score"],
        "conf": d["prediction_result"]["confidence"],
        "pattern": d["prediction_result"]["predicted_pattern"],
        "time": d["created_at"]
    } for d in docs])
    
    trend_data = []
    for d in reversed(docs[:10]):
        trend_data.append({"timestamp": d["created_at"].isoformat(), "efficiency_score": d["prediction_result"]["efficiency_score"]})

    return jsonify({
        "avg_efficiency": round(df['eff'].mean(), 1),
        "avg_confidence": round(df['conf'].mean() / 100, 2),
        "data_points": len(df),
        "most_common_pattern": df['pattern'].mode()[0],
        "pattern_distribution": df['pattern'].value_counts().to_dict(),
        "trend_data": trend_data,
        "trends": {"avg_efficiency": {"direction": "up", "change_percent": 5.0}}
    })

@app.route('/api/v1/feedback', methods=['POST'])
@jwt_required()
def feedback():
    user = get_jwt_identity()
    data = request.json
    get_db()["feedback"].insert_one({
        "user_id": user['id'],
        "prediction_id": data.get('prediction_id'),
        "rating": data.get('rating'),
        "created_at": datetime.utcnow()
    })
    return jsonify({"status": "success"})

@app.route('/api/v1/feature-importance', methods=['GET'])
def feature_importance():
    model = load_ml_model()
    if not model: return jsonify([])
    num_f = ['study_hours', 'break_time', 'sleep_hours', 'focus_score', 'previous_score']
    importances = model.named_steps['classifier'].feature_importances_
    return jsonify([{"feature": f, "importance": float(importances[i])} for i, f in enumerate(num_f)])

@app.route('/api/v1/weekly-report', methods=['GET'])
@jwt_required()
def weekly_report():
    user = get_jwt_identity()
    db = get_db()
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    docs = list(db["predictions"].find({
        "user_id": user['id'],
        "created_at": {"$gte": seven_days_ago}
    }))
    
    if not docs:
        return jsonify({"summary": "Insufficient data for a weekly report. Keep studying!", "days_logged": 0})
        
    df = pd.DataFrame([{"eff": d["prediction_result"]["efficiency_score"], "pattern": d["prediction_result"]["predicted_pattern"]} for d in docs])
    
    return jsonify({
        "summary": f"Great progress this week! Your average efficiency is {round(df['eff'].mean(), 1)}. You predominantly used the {df['pattern'].mode()[0]} pattern.",
        "days_logged": len(docs),
        "avg_weekly_focus": round(df['eff'].mean() / 50, 1), # Simplified heuristic
        "average_efficiency": round(df['eff'].mean(), 1),
        "most_common_pattern": df['pattern'].mode()[0]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

# reload trigger
