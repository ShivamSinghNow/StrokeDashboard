import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from io import BytesIO
import base64

def create_box_plot(df):
    symptoms = df.columns[:-3]
    fig = go.Figure()
    
    for symptom in symptoms:
        risk_values = df[df[symptom] == 1]['Stroke Risk (%)']
        if len(risk_values) > 0:
            fig.add_trace(go.Box(
                y=risk_values,
                name=symptom,
                boxpoints='outliers'
            ))
    
    fig.update_layout(
        title='Risk Distribution by Symptom',
        yaxis_title='Stroke Risk (%)',
        template='plotly_dark',
        height=500
    )
    
    # Convert to base64 for embedding in frontend
    buf = BytesIO()
    fig.write_image(buf, format='png')
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def create_correlation_heatmap(df):
    symptoms = df.columns[:-3]
    corr_matrix = df[symptoms].corr()
    
    fig = px.imshow(
        corr_matrix,
        labels=dict(color="Correlation"),
        color_continuous_scale='RdBu_r'
    )
    
    fig.update_layout(
        title='Symptom Correlation Heatmap',
        template='plotly_dark',
        height=600
    )
    
    buf = BytesIO()
    fig.write_image(buf, format='png')
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

