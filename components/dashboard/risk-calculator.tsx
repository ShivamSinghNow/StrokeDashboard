"use client"

import { useState } from "react"
import { AlertCircle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

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

export default function RiskCalculator() {
  const [loading, setLoading] = useState(false)
  const [age, setAge] = useState<number | undefined>(undefined)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [result, setResult] = useState<{ risk: number; isHighRisk: boolean } | null>(null)

  const handleCalculate = async () => {
    if (!age) return

    setLoading(true)
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          symptoms: selectedSymptoms,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Prediction failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl glass card-hover-effect">
      <CardHeader>
        <CardTitle>Risk Assessment Calculator</CardTitle>
        <CardDescription>Enter your age and select any symptoms you are experiencing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Age</Label>
          <Input
            type="number"
            placeholder="Enter your age"
            min={20}
            max={90}
            value={age || ""}
            onChange={(e) => setAge(e.target.value ? Number.parseInt(e.target.value) : undefined)}
            className="bg-background/50"
          />
        </div>

        <div className="space-y-2">
          <Label>Symptoms</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {symptoms.map((symptom) => (
              <div key={symptom} className="flex items-center space-x-2">
                <Checkbox
                  id={symptom}
                  checked={selectedSymptoms.includes(symptom)}
                  onCheckedChange={(checked) => {
                    setSelectedSymptoms((prev) => (checked ? [...prev, symptom] : prev.filter((s) => s !== symptom)))
                  }}
                />
                <label
                  htmlFor={symptom}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {symptom}
                </label>
              </div>
            ))}
          </div>
        </div>

        {result && (
          <Alert className={result.isHighRisk ? "border-red-500" : "border-green-500"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Risk Assessment Result</AlertTitle>
            <AlertDescription>
              <div className="space-y-1">
                <p>Risk Score: {(result.risk * 100).toFixed(1)}%</p>
                <p>Status: {result.isHighRisk ? "High Risk" : "Low Risk"}</p>
                {result.isHighRisk && (
                  <p className="text-red-500">Please consult with a healthcare professional immediately.</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button className="w-full" onClick={handleCalculate} disabled={loading || !age}>
          {loading ? "Calculating..." : "Calculate Risk"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

