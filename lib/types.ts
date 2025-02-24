export interface StrokeData {
  [key: string]: string | number // Add index signature for dynamic access
  "Chest Pain": string
  "Shortness of Breath": string
  "Irregular Heartbeat": string
  "Fatigue & Weakness": string
  Dizziness: string
  "Swelling (Edema)": string
  "Pain in Neck/Jaw/Shoulder/Back": string
  "Excessive Sweating": string
  "Persistent Cough": string
  "Nausea/Vomiting": string
  "High Blood Pressure": string
  "Chest Discomfort (Activity)": string
  "Cold Hands/Feet": string
  "Snoring/Sleep Apnea": string
  "Anxiety/Feeling of Doom": string
  Age: string
  "Stroke Risk (%)": string
  "At Risk (Binary)": string
}

export interface BoxPlotDataPoint {
  symptom: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
}

export interface ProcessedData {
  ageRiskData: Array<{
    age: number
    risk: number
    category: string
  }>
  symptomData: Array<{
    name: string
    highRisk: number
    lowRisk: number
  }>
  stats: {
    averageRisk: number
    highRiskCases: number
    riskFactors: number
    totalPatients: number
  }
  correlationMatrix: Array<{
    symptom: string
    correlations: number[]
  }>
  boxPlotData: BoxPlotDataPoint[]
}

