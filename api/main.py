from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from pydantic import BaseModel
from typing import List, Optional, Dict
from functools import lru_cache
from fastapi.responses import JSONResponse
import json
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"Starting server at {datetime.now()}")
print("Loading dataset...")

# Load data and train model once when starting the server
df = pd.read_csv("data/stroke_risk_dataset.csv")
X = df.drop(columns=['Stroke Risk (%)', 'At Risk (Binary)'])
y = df['At Risk (Binary)']

print(f"Dataset loaded with {len(df)} records")

# Train model with reduced complexity for faster predictions
model = RandomForestClassifier(
    n_estimators=50,
    min_samples_split=20,
    min_samples_leaf=10,
    random_state=42,
    n_jobs=-1
)
model.fit(X, y)

print("Model trained successfully")

def calculate_correlation_matrix():
    print("Calculating correlation matrix...")
    symptoms = df.columns[:-3]  # Exclude the last three columns
    correlation_matrix = []
    
    for symptom in symptoms:
        correlations = []
        for other_symptom in symptoms:
            corr = df[symptom].corr(df[other_symptom])
            correlations.append(float(corr))
        
        correlation_matrix.append({
            "symptom": symptom,
            "correlations": correlations
        })
    
    return correlation_matrix

def calculate_box_plot_data():
    print("Calculating box plot data...")
    symptoms = df.columns[:-3]
    box_plot_data = []
    
    for symptom in symptoms:
        risk_values = df[df[symptom] == 1]['Stroke Risk (%)']
        if len(risk_values) > 0:
            box_plot_data.append({
                "symptom": symptom,
                "min": float(risk_values.min()),
                "q1": float(risk_values.quantile(0.25)),
                "median": float(risk_values.median()),
                "q3": float(risk_values.quantile(0.75)),
                "max": float(risk_values.max()),
                "mean": float(risk_values.mean())
            })
    
    return box_plot_data

# Pre-aggregate age risk data
def preprocess_age_risk_data():
    print("Pre-processing age risk data...")
    age_groups = df.groupby('Age').agg({
        'Stroke Risk (%)': 'mean',
        'At Risk (Binary)': ['count', 'sum']
    }).reset_index()

    age_risk_data = []
    for _, row in age_groups.iterrows():
        total_count = row['At Risk (Binary)']['count']
        high_risk_count = row['At Risk (Binary)']['sum']
        
        age_risk_data.append({
            "age": int(row['Age']),
            "risk": float(row['Stroke Risk (%)']['mean']),
            "category": "High Risk",
            "count": int(high_risk_count)
        })
        age_risk_data.append({
            "age": int(row['Age']),
            "risk": float(row['Stroke Risk (%)']['mean']),
            "category": "Low Risk",
            "count": int(total_count - high_risk_count)
        })

    return age_risk_data

def preprocess_symptom_data():
    print("Pre-processing symptom data...")
    symptoms = df.columns[:-3]
    total = len(df)
    
    symptom_data = []
    for symptom in symptoms:
        mask_high = (df[symptom] == 1) & (df["At Risk (Binary)"] == 1)
        mask_low = (df[symptom] == 1) & (df["At Risk (Binary)"] == 0)
        
        high_risk = np.sum(mask_high)
        low_risk = np.sum(mask_low)
        
        symptom_data.append({
            "name": symptom,
            "highRisk": float((high_risk / total) * 100),
            "lowRisk": float((low_risk / total) * 100)
        })
    
    return symptom_data

def calculate_stats():
    print("Calculating overall statistics...")
    return {
        "averageRisk": float(df["Stroke Risk (%)"].mean()),
        "highRiskCases": int(df["At Risk (Binary)"].sum()),
        "riskFactors": len(df.columns[:-3]),
        "totalPatients": len(df)
    }

# Initialize cached data
print("Initializing cached data...")
CACHED_AGE_RISK_DATA = preprocess_age_risk_data()
CACHED_SYMPTOM_DATA = preprocess_symptom_data()
CACHED_STATS = calculate_stats()
CACHED_CORRELATION_MATRIX = calculate_correlation_matrix()
CACHED_BOX_PLOT_DATA = calculate_box_plot_data()

class PredictionInput(BaseModel):
    age: int
    symptoms: List[str]

@app.get("/api/dashboard-data")
async def get_dashboard_data(
    age_min: Optional[int] = Query(None, ge=0),
    age_max: Optional[int] = Query(None, le=100)
):
    try:
        # Filter age risk data based on query parameters
        filtered_age_data = CACHED_AGE_RISK_DATA
        if age_min is not None or age_max is not None:
            filtered_age_data = [
                d for d in CACHED_AGE_RISK_DATA
                if (age_min is None or d["age"] >= age_min) and
                   (age_max is None or d["age"] <= age_max)
            ]

        return JSONResponse(content={
            "ageRiskData": filtered_age_data,
            "symptomData": CACHED_SYMPTOM_DATA,
            "stats": CACHED_STATS,
            "correlationMatrix": CACHED_CORRELATION_MATRIX,
            "boxPlotData": CACHED_BOX_PLOT_DATA
        })
    except Exception as e:
        print(f"Error in get_dashboard_data: {str(e)}")
        return JSONResponse(
            content={"error": "Internal server error"},
            status_code=500
        )

@lru_cache(maxsize=1000)
def make_prediction(age: int, symptoms_key: str):
    try:
        features = {col: 0 for col in X.columns}
        features["Age"] = age
        
        for symptom in symptoms_key.split(','):
            if symptom in features:
                features[symptom] = 1
        
        feature_vector = pd.DataFrame([features])
        risk_prob = float(model.predict_proba(feature_vector)[0][1])
        is_high_risk = bool(model.predict(feature_vector)[0])

        return {
            "risk": risk_prob,
            "isHighRisk": is_high_risk
        }
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return None

@app.post("/api/predict")
async def predict(input_data: PredictionInput):
    try:
        symptoms_key = ','.join(sorted(input_data.symptoms))
        result = make_prediction(input_data.age, symptoms_key)
        if result is None:
            raise ValueError("Prediction failed")
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            content={"error": "Prediction failed"},
            status_code=500
        )

@app.get("/health")
async def health_check():
    memory_usage = df.memory_usage(deep=True).sum() / 1024 / 1024  # MB
    return {
        "status": "healthy",
        "data_loaded": len(df) > 0,
        "model_loaded": model is not None,
        "total_records": len(df),
        "memory_usage_mb": round(memory_usage, 2),
        "cached_age_groups": len(CACHED_AGE_RISK_DATA) // 2,
        "cached_symptoms": len(CACHED_SYMPTOM_DATA),
        "cached_correlation_matrix": len(CACHED_CORRELATION_MATRIX),
        "cached_box_plot_data": len(CACHED_BOX_PLOT_DATA)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

