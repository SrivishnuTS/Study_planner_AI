# Intelligent Study Pattern Prediction System

A full-stack, ML-driven application leveraging React, Flask, Scikit-learn, and MongoDB Atlas to predict optimal study habits while tracking efficiency and providing smart insights.

## Features
- **Dynamic Model Comparison**: Automatically pits Random Forest against Logistic Regression and serializes the best performing model based on accuracy.
- **Smart Recommendations**: Rule-based alerts and analytics derived from real-time behavior.
- **React Analytics Dashboard**: Integrates `Chart.js` for beautiful longitudinal trend visualizations.
- **MongoDB Atlas Backend**: Cloud-native prediction storage system with seamless history tracking.

## Tech Stack
- **Backend:** Flask, Python, MongoDB Atlas (PyMongo), Scikit-learn
- **Frontend:** React.js, React-Router, Chart.js, Axios
- **CI/CD:** GitHub Actions (Pytest, Auto-training pipelines)

## CI/CD Pipeline
The project features a multi-stage production-grade pipeline:
- **Build & Lint**: Validates Python code quality using `flake8`.
- **Test**: Executes unit and integration tests via `pytest` with `mongomock` for database isolation.
- **Train**: Automatically retrains the model on every push to `main` and versions artifacts using Git SHA.
- **Validate**: Enforces a 70% accuracy threshold gate before allowing deployment.
- **Docker**: Builds a production-ready container image.

### Required GitHub Secrets
To run the full pipeline in your own repository, configure the following secrets:
- `MONGODB_URI`: Connection string for MongoDB (used for deployment/integration).
- `JWT_SECRET_KEY`: Random string for signing authentication tokens.
- `FLASK_SECRET_KEY`: Secret key for Flask session management.

## Setup Instructions
1. Copy `.env.example` to `.env` and fill in your variables.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run training: `python train.py`.
4. Start backend: `python app.py`.
5. Start frontend: `cd frontend && npm start`.
