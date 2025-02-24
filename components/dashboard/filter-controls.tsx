"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SYMPTOMS = [
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

interface FilterControlsProps {
  onAgeRangeChange: (range: number[]) => void
  onSymptomChange: (symptom: string) => void
  selectedSymptom: string
  ageRange: number[]
}

export default function FilterControls({
  onAgeRangeChange,
  onSymptomChange,
  selectedSymptom,
  ageRange,
}: FilterControlsProps) {
  return (
    <Card className="col-span-1 h-fit border-muted bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="space-y-1.5">
        <CardTitle>Filter Options</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label>Age Range</Label>
          <div className="px-2">
            <Slider
              defaultValue={ageRange}
              max={90}
              min={20}
              step={1}
              value={ageRange}
              onValueChange={onAgeRangeChange}
              className="py-6"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{ageRange[0]} years</span>
            <span className="text-sm text-muted-foreground">{ageRange[1]} years</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Select Symptom</Label>
          <Select value={selectedSymptom} onValueChange={onSymptomChange}>
            <SelectTrigger className="w-full bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SelectValue placeholder="Select symptom" />
            </SelectTrigger>
            <SelectContent>
              {SYMPTOMS.map((symptom) => (
                <SelectItem key={symptom} value={symptom}>
                  {symptom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

