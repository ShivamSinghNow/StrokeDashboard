"use client"

import { useState } from "react"
import DashboardHeader from "@/components/dashboard/header"
import FilterControls from "@/components/dashboard/filter-controls"
import RiskCalculator from "@/components/dashboard/risk-calculator"
import PythonVisualizations from "@/components/dashboard/python-visualizations"

export default function DashboardPage() {
  const [selectedSymptom, setSelectedSymptom] = useState("High Blood Pressure")
  const [ageRange, setAgeRange] = useState<[number, number]>([40, 70])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-background/90">
      <DashboardHeader />
      <main className="flex-1 space-y-6 p-6 md:p-8 pt-6">
        <div className="grid gap-6 md:grid-cols-4">
          <FilterControls
            ageRange={ageRange}
            selectedSymptom={selectedSymptom}
            onAgeRangeChange={(range) => setAgeRange(range as [number, number])}
            onSymptomChange={setSelectedSymptom}
          />
          <div className="space-y-6 md:col-span-3">
            <PythonVisualizations selectedSymptom={selectedSymptom} ageRange={ageRange} />
          </div>
        </div>
        <RiskCalculator />
      </main>
    </div>
  )
}

