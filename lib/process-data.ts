export function calculateCorrelations(data: any[], selectedSymptom: string, ageRange: number[]) {
  // Filter data by age range
  const filteredData = data.filter((entry) => {
    const age = Number(entry.Age)
    return age >= ageRange[0] && age <= ageRange[1]
  })

  const symptoms = [
    "Chest Pain",
    "Shortness of Breath",
    "Irregular Heartbeat",
    "Fatigue & Weakness",
    "Dizziness",
    "Swelling (Edema)",
    "Pain in Neck/Jaw/Shoulder/Back",
    "Excessive Sweating",
    "Persistent Cough",
    "Nausea/Vomiting",
    "High Blood Pressure",
    "Chest Discomfort (Activity)",
    "Cold Hands/Feet",
    "Snoring/Sleep Apnea",
    "Anxiety/Feeling of Doom",
  ]

  // Calculate correlations
  const correlations = symptoms.flatMap((symptom1) => {
    return symptoms.map((symptom2) => {
      // Get arrays of symptom values (convert string to number)
      const values1 = filteredData.map((entry) => Number(entry[symptom1]))
      const values2 = filteredData.map((entry) => Number(entry[symptom2]))

      // Calculate correlation coefficient
      const correlation = calculateCorrelationCoefficient(values1, values2)

      return {
        source: symptom1,
        target: symptom2,
        value: correlation,
      }
    })
  })

  return correlations
}

function calculateCorrelationCoefficient(x: number[], y: number[]): number {
  const n = x.length
  const sum_x = x.reduce((a, b) => a + b, 0)
  const sum_y = y.reduce((a, b) => a + b, 0)
  const sum_xy = x.reduce((a, b, i) => a + b * y[i], 0)
  const sum_x2 = x.reduce((a, b) => a + b * b, 0)
  const sum_y2 = y.reduce((a, b) => a + b * b, 0)

  const numerator = n * sum_xy - sum_x * sum_y
  const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y))

  return denominator === 0 ? 0 : numerator / denominator
}

