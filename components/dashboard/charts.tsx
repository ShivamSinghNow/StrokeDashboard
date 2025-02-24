"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts"
import { useMemo } from "react"

// Add this near the top of your file
const TEST_DATA = [
  { age: 45, risk: 75, category: "High Risk", "High Blood Pressure": 1 },
  { age: 50, risk: 65, category: "High Risk", "High Blood Pressure": 1 },
  { age: 35, risk: 25, category: "Low Risk", "High Blood Pressure": 0 },
  { age: 40, risk: 30, category: "Low Risk", "High Blood Pressure": 0 },
]

// ... (keep existing interfaces and add new ones)

interface BoxPlotDataPoint {
  symptom: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
}

interface ChartProps {
  ageRiskData: Array<{
    age: number
    risk: number
    category: string
    [key: string]: any
  }>
  symptomData: Array<{
    name: string
    highRisk: number
    lowRisk: number
  }>
  correlationMatrix: Array<{
    symptom: string
    correlations: number[]
  }>
  boxPlotData: BoxPlotDataPoint[]
  selectedSymptom: string
  ageRange: number[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 shadow-xl">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm text-muted-foreground">
                {entry.name}: {entry.value.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

const shortenSymptomName = (symptom: string): string => {
  const acronymMap: { [key: string]: string } = {
    "High Blood Pressure": "HBP",
    "Shortness of Breath": "SOB",
    "Irregular Heartbeat": "IHB",
    "Fatigue & Weakness": "Fatigue",
    "Swelling (Edema)": "Edema",
    "Pain in Neck/Jaw/Shoulder/Back": "Pain",
    "Excessive Sweating": "Sweating",
    "Persistent Cough": "Cough",
    "Nausea/Vomiting": "Nausea",
    "Chest Discomfort (Activity)": "Chest Pain",
    "Cold Hands/Feet": "Cold Ext.",
    "Snoring/Sleep Apnea": "Sleep Apnea",
    "Anxiety/Feeling of Doom": "Anxiety",
  }
  return acronymMap[symptom] || symptom
}

// Add this new component for the comparative box plot
// Temporarily modify the ComparativeBoxPlot component to use test data
const ComparativeBoxPlot = ({
  data = TEST_DATA, // Add default test data
  selectedSymptom = "High Blood Pressure", // Add default symptom
  ...props
}) => {
  // Add debug logging
  console.log("ComparativeBoxPlot - Raw Data:", data)
  console.log("ComparativeBoxPlot - Selected Symptom:", selectedSymptom)

  const processBoxPlotData = (hasSymptom: boolean) => {
    // Filter data based on whether they have the symptom or not
    const filteredData = data.filter((d) => {
      console.log("Entry:", d, "Symptom value:", d[selectedSymptom], "Looking for:", hasSymptom)
      return Boolean(d[selectedSymptom]) === hasSymptom
    })

    console.log(`Data for ${hasSymptom ? "with" : "without"} symptom:`, filteredData)

    if (filteredData.length === 0) return null

    // Extract risk values
    const risks = filteredData.map((d) => d.risk)

    // Calculate statistics
    const sortedRisks = [...risks].sort((a, b) => a - b)
    const min = sortedRisks[0]
    const max = sortedRisks[sortedRisks.length - 1]
    const q1 = sortedRisks[Math.floor(sortedRisks.length * 0.25)]
    const median = sortedRisks[Math.floor(sortedRisks.length * 0.5)]
    const q3 = sortedRisks[Math.floor(sortedRisks.length * 0.75)]
    const mean = risks.reduce((a, b) => a + b, 0) / risks.length

    const stats = {
      min,
      max,
      q1,
      q3,
      median,
      mean,
      count: risks.length,
    }

    console.log(`Statistics for ${hasSymptom ? "with" : "without"} symptom:`, stats)
    return stats
  }

  const withSymptomStats = processBoxPlotData(true)
  const withoutSymptomStats = processBoxPlotData(false)

  if (!withSymptomStats || !withoutSymptomStats) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No data available for this symptom</p>
      </div>
    )
  }

  const boxPlotData = [
    {
      name: `With ${shortenSymptomName(selectedSymptom)}`,
      ...withSymptomStats,
      color: "#ef4444",
    },
    {
      name: `Without ${shortenSymptomName(selectedSymptom)}`,
      ...withoutSymptomStats,
      color: "#8b5cf6",
    },
  ]

  // Calculate chart dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 40 }
  const barWidth = 40

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={boxPlotData} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#94a3b8" }}
          label={{
            value: "Stroke Risk (%)",
            angle: -90,
            position: "insideLeft",
            fill: "#94a3b8",
            offset: -10,
          }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="glass rounded-lg p-3 shadow-xl">
                  <p className="text-sm font-medium">{data.name}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Median: {data.median.toFixed(1)}%</p>
                    <p>Mean: {data.mean.toFixed(1)}%</p>
                    <p>
                      Q1-Q3: {data.q1.toFixed(1)}% - {data.q3.toFixed(1)}%
                    </p>
                    <p>
                      Range: {data.min.toFixed(1)}% - {data.max.toFixed(1)}%
                    </p>
                    <p>Sample Size: {data.count}</p>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        {/* Render box plots */}
        {boxPlotData.map((entry, index) => {
          const xPos = (index + 1) * 150 // Adjust spacing between box plots
          return (
            <g key={entry.name}>
              {/* Vertical line (min to max) */}
              <line x1={xPos} x2={xPos} y1={entry.min} y2={entry.max} stroke={entry.color} strokeWidth={1} />
              {/* Box (Q1 to Q3) */}
              <rect
                x={xPos - barWidth / 2}
                y={entry.q3}
                width={barWidth}
                height={entry.q1 - entry.q3}
                stroke={entry.color}
                strokeWidth={1}
                fill={entry.color}
                fillOpacity={0.3}
              />
              {/* Median line */}
              <line
                x1={xPos - barWidth / 2}
                x2={xPos + barWidth / 2}
                y1={entry.median}
                y2={entry.median}
                stroke={entry.color}
                strokeWidth={2}
              />
              {/* Min line */}
              <line
                x1={xPos - barWidth / 4}
                x2={xPos + barWidth / 4}
                y1={entry.min}
                y2={entry.min}
                stroke={entry.color}
                strokeWidth={1}
              />
              {/* Max line */}
              <line
                x1={xPos - barWidth / 4}
                x2={xPos + barWidth / 4}
                y1={entry.max}
                y2={entry.max}
                stroke={entry.color}
                strokeWidth={1}
              />
            </g>
          )
        })}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DashboardCharts({
  ageRiskData,
  symptomData,
  correlationMatrix,
  boxPlotData,
  selectedSymptom,
  ageRange,
}: ChartProps) {
  // ... (keep existing filtering logic)
  // Filter and process data based on age range
  const filteredData = useMemo(() => {
    return ageRiskData.filter((item) => item.age >= ageRange[0] && item.age <= ageRange[1])
  }, [ageRiskData, ageRange])

  // Process trend data with filtered data
  const trendData = useMemo(() => {
    return filteredData
      .reduce((acc: any[], curr) => {
        const existingAge = acc.find((item) => item.age === curr.age)
        if (existingAge) {
          existingAge.risk = (existingAge.risk * existingAge.count + curr.risk) / (existingAge.count + 1)
          existingAge.count += 1
        } else {
          acc.push({ age: curr.age, risk: curr.risk, count: 1 })
        }
        return acc
      }, [])
      .sort((a, b) => a.age - b.age)
  }, [filteredData])

  // Calculate correlation data for heatmap
  const correlationData = useMemo(() => {
    const selectedSymptomData = correlationMatrix.find((item) => item.symptom === selectedSymptom)
    if (!selectedSymptomData) return []

    return correlationMatrix.map((item, index) => ({
      symptom: item.symptom,
      correlation: selectedSymptomData.correlations[index],
    }))
  }, [correlationMatrix, selectedSymptom])

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scatter Plot with Trendline */}
        <Card className="glass card-hover-effect">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Age vs Stroke Risk</span>
              <span className="text-sm text-muted-foreground">
                Ages {ageRange[0]} - {ageRange[1]}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="age" type="number" domain={[ageRange[0], ageRange[1]]} tick={{ fill: "#94a3b8" }} />
                  <YAxis dataKey="risk" domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Scatter
                    name="High Risk"
                    data={filteredData.filter((d) => d.category === "High Risk")}
                    fill="#ef4444"
                  />
                  <Scatter
                    name="Low Risk"
                    data={filteredData.filter((d) => d.category === "Low Risk")}
                    fill="#8b5cf6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Replace Correlation Heatmap with Comparative Box Plot */}
        <Card className="glass card-hover-effect">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Risk Distribution Comparison</span>
              <span className="text-sm text-muted-foreground">{shortenSymptomName(selectedSymptom)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ComparativeBoxPlot data={ageRiskData} selectedSymptom={selectedSymptom} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Box Plot */}
        <Card className="glass card-hover-effect">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Risk Distribution by Symptom</span>
              <span className="text-sm text-muted-foreground">Box Plot</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] overflow-x-auto custom-scrollbar">
              <div className="min-w-[800px]">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={boxPlotData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="symptom"
                      tick={{ fill: "#94a3b8" }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickFormatter={shortenSymptomName}
                    />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="glass rounded-lg p-3 shadow-xl">
                              <p className="text-sm font-medium">{data.symptom}</p>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Median: {data.median.toFixed(1)}%</p>
                                <p>
                                  Q1-Q3: {data.q1.toFixed(1)}% - {data.q3.toFixed(1)}%
                                </p>
                                <p>
                                  Range: {data.min.toFixed(1)}% - {data.max.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="median" fill="url(#boxPlotGradient)" />
                    <defs>
                      <linearGradient id="boxPlotGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stacked Bar Chart */}
        <Card className="glass card-hover-effect">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Symptom Distribution</span>
              <span className="text-sm text-muted-foreground">High vs Low Risk</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickFormatter={shortenSymptomName}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="highRisk" name="High Risk" stackId="a" fill="url(#colorHigh)" />
                  <Bar dataKey="lowRisk" name="Low Risk" stackId="a" fill="url(#colorLow)" />
                  <defs>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

