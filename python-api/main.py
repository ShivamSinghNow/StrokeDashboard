from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from pydantic import BaseModel
from typing import List, Optional
from functools import lru_cache
from fastapi.responses import JSONResponse
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from datetime import datetime
import os

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

# Generate sample data if real dataset is not available
def generate_sample_data():
    print("Generating sample data...")
    np.random.seed(42)
    n_samples = 1000
    
    # Generate age data
    ages = np.random.normal(65, 10, n_samples).clip(20, 90).astype(int)
    
    # Generate symptoms (15 symptoms)
    symptoms = [
        "Chest Pain", "Shortness of Breath", "Irregular Heartbeat",
        "Fatigue & Weakness", "Dizziness", "Swelling (Edema)",
        "Pain in Neck/Jaw/Shoulder/Back", "Excessive Sweating",
        "Persistent Cough", "Nausea/Vomiting", "High Blood Pressure",
        "Chest Discomfort (Activity)", "Cold Hands/Feet",
        "Snoring/Sleep Apnea", "Anxiety/Feeling of Doom"
    ]
    
    # Generate random symptom data
    symptom_data = np.random.binomial(1, 0.3, (n_samples, len(symptoms)))
    
    # Calculate risk based on age and symptoms
    base_risk = (ages - 20) / 70 * 30  # Age-based risk
    symptom_risks = np.sum(symptom_data * np.random.uniform(5, 15, len(symptoms)), axis=1)
    stroke_risk = (base_risk + symptom_risks).clip(0, 100)
    
    # Generate binary risk (1 if risk > 50)
    at_risk = (stroke_risk > 50).astype(int)
    
    # Create DataFrame
    data = {
        'Age': ages,
        'Stroke Risk (%)': stroke_risk,
        'At Risk (Binary)': at_risk
    }
    
    # Add symptom columns
    for i, symptom in enumerate(symptoms):
        data[symptom] = symptom_data[:, i]
    
    return pd.DataFrame(data)

# Try to load the real dataset, fall back to sample data if not available
try:
    print("Loading dataset...")
    if os.path.exists("data/stroke_risk_dataset.csv"):
        df = pd.read_csv("data/stroke_risk_dataset.csv")
        print("Real dataset loaded successfully")
    else:
        print("Dataset file not found, using sample data")
        df = generate_sample_data()
except Exception as e:
    print(f"Error loading dataset: {str(e)}")
    print("Falling back to sample data")
    df = generate_sample_data()

# Load data and train model once when starting the server
# df = pd.read_csv("data/stroke_risk_dataset.csv")
X = df.drop(columns=['Stroke Risk (%)', 'At Risk (Binary)'])
y = df['At Risk (Binary)']

# Get list of symptoms once
SYMPTOMS = [col for col in df.columns if col not in ['Age', 'Stroke Risk (%)', 'At Risk (Binary)']]

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

def preprocess_age_risk_data():
    print("Pre-processing age risk data...")
    
    # Convert DataFrame to numpy array for faster processing
    age_array = df['Age'].to_numpy()
    risk_array = df['Stroke Risk (%)'].to_numpy()
    at_risk_array = df['At Risk (Binary)'].to_numpy()
    
    # Create symptom arrays
    symptom_arrays = {symptom: df[symptom].to_numpy() for symptom in SYMPTOMS}
    
    # Pre-allocate list with known size for better memory efficiency
    age_risk_data = []
    
    # Process in batches for better performance
    batch_size = 1000
    for i in range(0, len(df), batch_size):
        end_idx = min(i + batch_size, len(df))
        
        batch_data = []
        for j in range(i, end_idx):
            entry = {
                "age": int(age_array[j]),
                "risk": float(risk_array[j]),
                "category": "High Risk" if at_risk_array[j] == 1 else "Low Risk"
            }
            
            # Add symptoms efficiently
            for symptom, arr in symptom_arrays.items():
                entry[symptom] = int(arr[j])
            
            batch_data.append(entry)
        
        age_risk_data.extend(batch_data)
    
    return age_risk_data

def calculate_correlation_matrix():
    print("Calculating correlation matrix...")
    # Calculate correlation matrix once using numpy for better performance
    symptom_data = df[SYMPTOMS].to_numpy()
    corr_matrix = np.corrcoef(symptom_data.T)
    
    return [
        {
            "symptom": symptom,
            "correlations": [float(corr) for corr in corr_matrix[i]]
        }
        for i, symptom in enumerate(SYMPTOMS)
    ]

def calculate_box_plot_data():
    print("Calculating box plot data...")
    box_plot_data = []
    
    # Use numpy operations for better performance
    risk_array = df['Stroke Risk (%)'].to_numpy()
    
    for symptom in SYMPTOMS:
        mask = df[symptom] == 1
        if mask.any():
            risk_values = risk_array[mask]
            box_plot_data.append({
                "symptom": symptom,
                "min": float(np.min(risk_values)),
                "q1": float(np.percentile(risk_values, 25)),
                "median": float(np.median(risk_values)),
                "q3": float(np.percentile(risk_values, 75)),
                "max": float(np.max(risk_values)),
                "mean": float(np.mean(risk_values))
            })
    
    return box_plot_data

def preprocess_symptom_data():
    print("Pre-processing symptom data...")
    total = len(df)
    symptom_data = []
    
    # Use numpy operations for better performance
    at_risk_array = df['At Risk (Binary)'].to_numpy()
    
    for symptom in SYMPTOMS:
        symptom_array = df[symptom].to_numpy()
        mask_high = (symptom_array == 1) & (at_risk_array == 1)
        mask_low = (symptom_array == 1) & (at_risk_array == 0)
        
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
        "riskFactors": len(SYMPTOMS),
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
        # Use numpy for faster filtering
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

@app.get("/api/debug/age-risk-data")
async def debug_age_risk_data():
    """Debug endpoint to check the structure of age risk data"""
    sample_data = CACHED_AGE_RISK_DATA[:5] if CACHED_AGE_RISK_DATA else []
    return JSONResponse(content={
        "count": len(CACHED_AGE_RISK_DATA),
        "sample_data": sample_data,
        "has_symptoms": bool(sample_data and len(sample_data[0].keys()) > 4)  # Should have more than just age, risk, category
    })

# Add a new debug endpoint to check specific symptom data
@app.get("/api/debug/symptom-data/{symptom}")
async def debug_symptom_data(symptom: str):
    """Debug endpoint to check data for a specific symptom"""
    if not CACHED_AGE_RISK_DATA:
        return JSONResponse(content={"error": "No data available"})
    
    # Count records with and without the symptom
    with_symptom = [d for d in CACHED_AGE_RISK_DATA if d.get(symptom) == 1]
    without_symptom = [d for d in CACHED_AGE_RISK_DATA if d.get(symptom) == 0]
    
    return JSONResponse(content={
        "symptom": symptom,
        "total_records": len(CACHED_AGE_RISK_DATA),
        "with_symptom": {
            "count": len(with_symptom),
            "sample": with_symptom[:5] if with_symptom else []
        },
        "without_symptom": {
            "count": len(without_symptom),
            "sample": without_symptom[:5] if without_symptom else []
        }
    })

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

def create_comparative_boxplot(selected_symptom: str):
    """Create a comparative box plot for a selected symptom"""
    # Split data based on symptom presence
    with_symptom = df[df[selected_symptom] == 1]['Stroke Risk (%)']
    without_symptom = df[df[selected_symptom] == 0]['Stroke Risk (%)']
    
    # Create figure
    fig = go.Figure()
    
    # Add box plots
    fig.add_trace(go.Box(
        y=with_symptom,
        name=f'With {selected_symptom}',
        boxpoints='outliers',
        marker_color='#ef4444'
    ))
    
    fig.add_trace(go.Box(
        y=without_symptom,
        name=f'Without {selected_symptom}',
        boxpoints='outliers',
        marker_color='#8b5cf6'
    ))
    
    # Update layout
    fig.update_layout(
        title=f'Risk Distribution: {selected_symptom}',
        yaxis_title='Stroke Risk (%)',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#94a3b8')
    )
    
    return fig.to_json()

def create_scatter_plot(age_range: List[int]):
    """Create a scatter plot for age vs risk"""
    fig = px.scatter(
        df,
        x='Age',
        y='Stroke Risk (%)',
        color='At Risk (Binary)',
        color_discrete_map={1: '#ef4444', 0: '#8b5cf6'},
        labels={'At Risk (Binary)': 'Risk Category'},
        range_x=age_range
    )
    
    fig.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#94a3b8')
    )
    
    return fig.to_json()

def create_symptom_distribution():
    """Create a stacked bar chart for symptom distribution"""
    symptom_stats = []
    
    for symptom in SYMPTOMS:
        high_risk = df[(df[symptom] == 1) & (df['At Risk (Binary)'] == 1)].shape[0]
        low_risk = df[(df[symptom] == 1) & (df['At Risk (Binary)'] == 0)].shape[0]
        total = len(df)
        
        symptom_stats.append({
            'Symptom': symptom,
            'High Risk (%)': (high_risk / total) * 100,
            'Low Risk (%)': (low_risk / total) * 100
        })
    
    symptom_df = pd.DataFrame(symptom_stats)
    
    fig = go.Figure(data=[
        go.Bar(
            name='High Risk',
            y=symptom_df['Symptom'],
            x=symptom_df['High Risk (%)'],
            orientation='h',
            marker_color='#ef4444'
        ),
        go.Bar(
            name='Low Risk',
            y=symptom_df['Symptom'],
            x=symptom_df['Low Risk (%)'],
            orientation='h',
            marker_color='#8b5cf6'
        )
    ])
    
    fig.update_layout(
        barmode='stack',
        title='Symptom Distribution by Risk Category',
        xaxis_title='Percentage of Patients',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#94a3b8'),
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        )
    )
    
    return fig.to_json()

# Add this new function after the other visualization functions
def create_correlation_heatmap():
    """Create a heatmap showing correlations between symptoms and stroke risk"""
    # Calculate correlations between symptoms and risk
    risk_correlations = {}
    for symptom in SYMPTOMS:
        corr = df[symptom].corr(df['Stroke Risk (%)'])
        risk_correlations[symptom] = corr
    
    # Sort symptoms by their correlation with stroke risk
    sorted_symptoms = sorted(SYMPTOMS, key=lambda x: risk_correlations[x], reverse=True)
    
    # Create correlation matrix including stroke risk
    columns_to_correlate = sorted_symptoms + ['Stroke Risk (%)']
    correlation_matrix = df[columns_to_correlate].corr()
    
    # Create heatmap
    fig = go.Figure(data=go.Heatmap(
        z=correlation_matrix.values,
        x=correlation_matrix.columns,
        y=correlation_matrix.columns,
        colorscale=[
            [0, '#4a148c'],    # Dark purple for negative correlations
            [0.5, '#121212'],  # Dark background for no correlation
            [1, '#ef4444']     # Red for positive correlations
        ],
        zmin=-1,
        zmax=1,
        text=np.round(correlation_matrix.values, 2),
        texttemplate='%{text}',
        textfont={"size": 10},
        hoverongaps=False,
        hovertemplate='%{x}<br>%{y}<br>Correlation: %{z:.2f}<extra></extra>'
    ))
    
    # Update layout
    fig.update_layout(
        title='Symptom & Risk Correlation Heatmap',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#94a3b8'),
        height=800,  # Make it square and large enough to be readable
        width=800,
        xaxis=dict(
            tickangle=45,
            tickfont=dict(size=10)
        ),
        yaxis=dict(
            tickfont=dict(size=10)
        )
    )
    
    return fig.to_json()

# Update the get_visualizations endpoint to include the new heatmap
@app.get("/api/visualizations")
async def get_visualizations(
    selected_symptom: str = "High Blood Pressure",
    age_min: int = 20,
    age_max: int = 90
):
    try:
        return JSONResponse(content={
            "comparativeBoxPlot": create_comparative_boxplot(selected_symptom),
            "scatterPlot": create_scatter_plot([age_min, age_max]),
            "symptomDistribution": create_symptom_distribution(),
            "correlationHeatmap": create_correlation_heatmap()  # Add the new visualization
        })
    except Exception as e:
        print(f"Error generating visualizations: {str(e)}")
        return JSONResponse(
            content={"error": "Failed to generate visualizations"},
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
        "cached_age_groups": len(CACHED_AGE_RISK_DATA),
        "cached_symptoms": len(CACHED_SYMPTOM_DATA),
        "cached_correlation_matrix": len(CACHED_CORRELATION_MATRIX),
        "cached_box_plot_data": len(CACHED_BOX_PLOT_DATA)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

